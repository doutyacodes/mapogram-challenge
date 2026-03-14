export function calculateAgeAndWeeks(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    
    // Calculate the base age in years
    let age = today.getFullYear() - birthDate.getFullYear();

    // Adjust age if the birth date hasn't occurred yet this year
    if (
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    // Calculate the most recent birthday date
    const lastBirthday = new Date(birthDate);
    lastBirthday.setFullYear(today.getFullYear());
    if (today < lastBirthday) {
        lastBirthday.setFullYear(today.getFullYear() - 1);
    }

    // Calculate weeks since the most recent birthday, starting from Sunday
    const dayDiff = Math.floor((today - lastBirthday) / (1000 * 60 * 60 * 24));
    let weeks = Math.floor(dayDiff / 7);

    // Adjust weeks to start counting each Sunday
    const lastSunday = new Date(lastBirthday);
    lastSunday.setDate(lastSunday.getDate() + (7 - lastBirthday.getDay()) % 7);

    if (today >= lastSunday) {
        weeks = Math.floor((dayDiff - (7 - lastBirthday.getDay())) / 7);
    }

    return { age, weeks };
}