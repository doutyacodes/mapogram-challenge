import base64
import json
import re

def decode_base64(s):
    try:
        return base64.b64decode(s).decode('utf-8')
    except:
        return s

def extract_inserts(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find INSERT INTO statements
    # This is rough but should work for the provided structure
    inserts = re.findall(r"INSERT INTO `(\w+)` \((.*?)\) VALUES\s*(.*?);", content, re.DOTALL)
    
    data = {}
    for table, columns, values_str in inserts:
        cols = [c.strip(" `") for c in columns.split(',')]
        # Split values by ), ( while ignoring those inside quotes (simplified)
        # This part is tricky with complex strings, but given the sample it's mostly straightforward
        # We'll do a better split
        rows = []
        # Match each (val1, val2, ...)
        row_matches = re.findall(r"\((.*?)\)(?:,|$)", values_str, re.DOTALL)
        for row_match in row_matches:
            # Split by comma but ignore commas inside quotes
            # Simplified split
            vals = []
            curr = []
            in_quote = False
            for char in row_match:
                if char == "'" and (len(curr) == 0 or curr[-1] != "\\"):
                    in_quote = not in_quote
                if char == "," and not in_quote:
                    vals.append("".join(curr).strip().strip("'"))
                    curr = []
                else:
                    curr.append(char)
            vals.append("".join(curr).strip().strip("'"))
            rows.append(dict(zip(cols, vals)))
        data[table] = rows
    return data

def generate_db_alter2(source_data):
    sql = ["-- db_alter2.sql\n-- Data Migration from Wowfy to Mapogram\n"]
    
    photo_prefix = "https://wowfy.in/wowfy_app_codebase/photos/"
    video_prefix = "https://wowfy.in/wowfy_app_codebase/videos/"

    # 1. Migrate DISTRICTS to PAGES and DISTRICTS
    # We iterate over the 90 districts from wowfy2.sql
    if 'districts' in source_data:
        sql.append("-- 1. PAGES & DISTRICTS (Kerala, Karnataka, etc.)")
        for d in source_data['districts']:
            title = d['title']
            desc = decode_base64(d['description'])
            image = d['image']
            
            # Create a Page first
            # We'll use a placeholder geofence (circular polygon)
            geofence = json.dumps([[10.0, 76.0], [10.1, 76.0], [10.1, 76.1], [10.0, 76.1]]) 
            
            sql.append(f"INSERT INTO `pages` (`id`, `title`, `description`, `icon`, `geofence`, `type`, `active`) VALUES ({d['district_id']}, '{title}', '{desc}', '{photo_prefix}{image}', '{geofence}', 'tourism', 1);")
            
            # Create the District entry linked to the Page
            sql.append(f"INSERT INTO `districts` (`id`, `page_id`, `name`, `description`, `image_url`) VALUES ({d['district_id']}, {d['district_id']}, '{title}', '{desc}', '{photo_prefix}{image}');")
        sql.append("\n")

    # 2. CHALLENGES
    if 'challenges' in source_data:
        sql.append("-- 2. CHALLENGES")
        for c in source_data['challenges']:
            cid = c['challenge_id']
            pid = c['page_id']
            title = c['title']
            did = c['district_id'] if c['district_id'] != 'NULL' else 'NULL'
            desc = decode_base64(c['description'])
            ctype = c['challenge_type']
            freq = c['frequency']
            # Map frequency to my enum
            freq_map = {'challenges': 'once', 'daily': 'daily', 'quiz': 'quiz', 'food': 'food', 'experience': 'experience'}
            my_freq = freq_map.get(freq, 'once')
            
            start = c['start_date']
            end = c['end_date']
            ep = c['entry_points']
            rp = c['reward_points']
            lvl = c['level']
            exp = c['exp_type']
            
            sql.append(f"INSERT INTO `challenges` (`id`, `district_id`, `page_id`, `title`, `description`, `challenge_type`, `frequency`, `start_date`, `end_date`, `entry_points`, `reward_points`, `level_required`, `exp_type`) VALUES ({cid}, {did}, {pid}, '{title}', '{desc}', '{ctype}', '{my_freq}', '{start}', '{end}', {ep}, {rp}, {lvl}, '{exp}');")
        sql.append("\n")

    # 3. TASKS
    if 'tasks' in source_data:
        sql.append("-- 3. TASKS")
        for t in source_data['tasks']:
            tid = t['task_id']
            cid = t['challenge_id']
            name = t['task_name']
            desc = decode_base64(t['description'])
            ttype = t['task_type']
            # Map task type
            type_map = {'quiz': 'quiz', 'mediaCapture': 'media_upload', 'videoCapture': 'media_upload', 'stepCounter': 'pedometer', 'map': 'location_checkin'}
            my_type = type_map.get(ttype, 'media_upload')
            
            vm = t['verification_method']
            rp = t['reward_points']
            rx = 10 # Default XP
            ord_idx = t['day']
            
            sql.append(f"INSERT INTO `tasks` (`id`, `challenge_id`, `title`, `description`, `task_type`, `verification_method`, `reward_points`, `reward_xp`, `order_index`) VALUES ({tid}, {cid}, '{name}', '{desc}', '{my_type}', '{vm}', {rp}, {rx}, {ord_idx});")
        sql.append("\n")

    # 4. MEDIA (Challenge & Task)
    if 'challenge_media' in source_data:
        sql.append("-- 4. CHALLENGE MEDIA")
        for m in source_data['challenge_media']:
            prefix = photo_prefix if m['media_type'] == 'photo' else video_prefix
            sql.append(f"INSERT INTO `challenge_media` (`challenge_id`, `media_type`, `media_url`) VALUES ({m['challenge_id']}, '{m['media_type'].replace('photo', 'image')}', '{prefix}{m['media_path']}');")
    
    if 'task_media' in source_data:
        sql.append("-- 5. TASK MEDIA")
        for m in source_data['task_media']:
            prefix = photo_prefix if m['media_type'] == 'photo' else video_prefix
            sql.append(f"INSERT INTO `task_media` (`task_id`, `media_type`, `media_url`) VALUES ({m['task_id']}, '{m['media_type'].replace('photo', 'image')}', '{prefix}{m['media_path']}');")
        sql.append("\n")

    # 5. QUESTIONS & ANSWERS
    if 'questions' in source_data:
        sql.append("-- 6. QUESTIONS")
        for q in source_data['questions']:
            qid = q['id']
            tid = 5 # Default task ID for quiz in sample data was 5
            txt = q['question']
            qtype = q['type']
            timer = q['timer']
            media = q['image'] if q['image'] != 'NULL' else (q['video'] if q['video'] != 'NULL' else q['audio'])
            pref = photo_prefix if qtype == 'image' else (video_prefix if qtype == 'video' else '')
            murl = f"'{pref}{media}'" if media != 'NULL' else "NULL"
            
            sql.append(f"INSERT INTO `questions` (`id`, `task_id`, `question_text`, `question_type`, `media_url`, `timer_seconds`) VALUES ({qid}, {tid}, '{txt}', '{qtype}', {murl}, {timer});")

    if 'answers' in source_data:
        sql.append("-- 7. ANSWERS")
        for a in source_data['answers']:
            qid = a['question_id']
            txt = a['answer_text']
            is_corr = 1 if a['answer'] == 'yes' else 0
            sql.append(f"INSERT INTO `answers` (`question_id`, `answer_text`, `is_correct`) VALUES ({qid}, '{txt}', {is_corr});")
        sql.append("\n")

    return "\n".join(sql)

# Execution
data = extract_inserts('wowfy2.sql')
output_sql = generate_db_alter2(data)
with open('db_alter2.sql', 'w', encoding='utf-8') as f:
    f.write(output_sql)
print("db_alter2.sql generated successfully")
