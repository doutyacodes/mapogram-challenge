const { default: axios } = require("axios");

// Set a global timeout of 35 seconds (35000 milliseconds)
// axios.defaults.timeout = 35000; // 35 seconds

const CreateNewUser = (data) => axios.post("/api/user", data);
const LoginUser = (data) => axios.post("/api/login", data);
const GetUser = (token) =>
  axios.get("/api/getUser", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const GetUserData = (token) => {
  return axios.get("/api/getUserData", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const UpdateUser = (data, token) => {
  return axios.put("/api/updateUser", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetQuizData = (id, token) => {
  return axios.get(`/api/getQuizData/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
const GetQuizDataKids = (id, token) => {
  return axios.get(`/api/getQuizDataKids/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
const SaveQuizProgress = (data, token, quizId) => {
  const payload = {
    quizId,
    results: data,
  };

  return axios.post(`/api/quizProgress`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const SaveQuizResult = (token) => {
  return axios.post(
    "/api/quizResult",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

const GetCareerQuiz = (id, token) => {
  return axios.get(`/api/getPersonalityData/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
const GetCareerQuizKids = (id, token) => {
  return axios.get(`/api/getPersonalityDataKids/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const SaveCarrierQuizProgress = (data, token, quizId) => {
  const payload = {
    quizId,
    results: data,
  };

  return axios.post(`/api/carrierQuizProgress`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const SaveCareerQuizResult = (token) => {
  return axios.post(
    `/api/CareerQuizResult`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

const InterestResult = (data) =>
  axios.post("/api/resultTwo", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

const GetUserId = (token, language, selectedChildId) =>
  axios.post(
    "/api/getUserId",
    {
      childId: selectedChildId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": language,
      },
    }
  );

const GetDashboarCheck = (token) => {
  return axios.get(`/api/getDashboardCheckData`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetResult2 = (token, industryParam, language) =>
  axios.get("/api/getresult2", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": language,
    },
    params: {
      industry: industryParam,
    },
  });
const getResult2Career = (token, career_name, language) =>
  axios.get("/api/getResult2Career", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": language,
    },
    params: {
      career_name: career_name,
    },
  });

const GetIndustry = (token, language) => {
  return axios.get(`/api/getIndustry`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": language,
    },
  });
};

const SubmitFeedback = (token, data) =>
  axios.post("/api/feedback", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const CheckFeedback = (token) =>
  axios.get("/api/feedback", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const SaveCarrerData = (token, data) => {
  return axios.post(`/api/saveCareers`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetCarrerData = (token) => {
  return axios.get(`/api/getCareers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetRoadMapData = (userCareerId, token, language) => {
  return axios.get(`/api/getRoadmapData/${userCareerId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": language,
    },
  });
};

const GetStrengthsQuiz = (id, token) => {
  return axios.get(`/api/getStrengthsQuizData/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const SaveStrengthQuizProgress = (data, token, quizId) => {
  const payload = {
    quizId,
    results: data,
  };

  return axios.post(`/api/strengthQuizProgress`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const SaveStrengthQuizResult = (token) => {
  return axios.post(
    `/api/StrengthQuizResult`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

const GetUserAge = (token) =>
  axios.get("/api/getUserAge", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const SaveInterestedCareer = (token, careerName, country) => {
  const payload = {
    career: careerName,
    country: country,
  };

  return axios.post(`/api/saveInterestedCareers`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetContests = (token) => {
  return axios.get(`/api/getContests/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


const SaveContestProgress = (data, token, taskId) => {
  const payload = {
    taskId,
    results: data,
  };

  return axios.post(`/api/saveContestProgress`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const UpdateContestData = (token, taskId) => {
  const payload = {
    taskId,
  };

  return axios.post(`/api/updateContestData`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetContestResultData = (token) => {
  return axios.get(`/api/getContestResultData/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetTests = (id, token) => {
  return axios.get(`/api/getTests/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetSubjects = (id, token) => {
  return axios.get(`/api/getSubject/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetTestsData = (id, token) => {
  return axios.get(`/api/getTestData/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetSkillTestsData = (subjectName, token) => {
  return axios.get(`/api/getSkillTestData/${subjectName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const SaveTestProgress = (data, token) => {
  const payload = {
    results: data,
  };

  return axios.post(`/api/saveTestProgress`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const UpdateTestData = (token, testId) => {
  const payload = {
    testId,
  };

  return axios.post(`/api/updateTestData`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetTestResultData = (token) => {
  return axios.get(`/api/getTestResultData/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetLeaderboardData = (id, token) => {
  return axios.get(`/api/getLeaderboardData/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const getActivities = (id, token) => {
  return axios.get(`/api/getActivity/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const updateActivityStatus = (token, activityId, status) => {
  const payload = {
    activityId,
    status,
  };

  return axios.post(`/api/updateActivityStatus`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const getChallenges = (id, token, language) => {
  return axios.get(`/api/getChallenge/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": language,
    },
  });
};

const submitChallenge = (formData, token) => {
  return axios.post(`/api/submitChallenge`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

const getChallengesByStatus = (status, id, token) => {
  return axios.get(`/api/getChallengesStatus`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      status,
      id,
    },
  });
};
const getLastSubmittedChallenge = (id, token) => {
  return axios.get(`/api/getLastSubmittedChallenge`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      id: id,
    },
  });
};

const UpdateMileStoneStatus = (data, token) => {
  return axios.put("/api/updateMileStoneStatus", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetFeedBackData = (id, token, language) => {
  return axios.get(`/api/getFeedBackData/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": language,
    },
  });
};
const setCountries = (data, token) => {
  return axios.put("/api/setCountry", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetKidsResult = (token, language) =>
  axios.get("/api/getKidsResult", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": language,
    },
  });

const getCareerName = (id) => {
  return axios.get(`/api/getCareerName/${id}`);
};

const GetCareerPath = (id, token, language) => {
  return axios.get(`/api/getCareerPath/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": language,
    },
  });
};

const SkillTestProgress = (data, token) => {
  const payload = {
    results: data,
  };

  return axios.post(`/api/skillTestProgress`, payload, {
    /* saveTestProgress */
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const UpdateSkillTestData = (token, subjectId) => {
  const payload = {
    certificationId,
  };

  return axios.post(`/api/updateSkillTestData`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetSkillTestResult = (token, id) => {
  return axios.get(`/api/getskillTestResult/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetUserCommunity = (token) => {
  return axios.get(`/api/getUserCommunity`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetAllCareerCommunity = (careerId, token) => {
  const payload = {
    careerId,
  };
  return axios.post(
    `/api/getAllCareerCommunity`,
    payload, // Pass careerId in the request body
    {
      headers: {
        Authorization: `Bearer ${token}`, // Add token in headers
      },
    }
  );
};
/* Community */

const AddPostToCommunity = (token, payload) => {
  return axios.post(`/api/addPostToCommunity`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

const GetCommunityPosts = (token, id) => {
  return axios.get(`/api/getCommunityPosts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const AddPostLike = (token, data) => {
  return axios.post("/api/addPostLike", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const AddPostComment = (token, data) => {
  return axios.post("/api/addPostComment", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/* Certification */
const GetCertificationTest = (id, token) => {
  return axios.get(`/api/getCertificationTest/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const CertificationTestProgress = (data, token) => {
  const payload = {
    results: data,
  };

  return axios.post(`/api/saveCertificationTestProgress`, payload, {
    /* saveTestProgress */
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const UpdateCertificationTest = (token, certificationId) => {
  const payload = {
    certificationId,
  };

  return axios.post(`/api/updateCertificationTest`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const GetCertificationResult = (token, id) => {
  return axios.get(`/api/getCertificationResult/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/* Certification */
const GetCourseOverview = (id, token) => {
  return axios.get(`/api/get-course/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/* Certification */
const GetCertificationCourse = (id, token) => {
  return axios.get(`/api/get-course-data/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const UpdateCertificationStatus = (data, token) => {
  return axios.put("/api/updateCertificationStatus", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export default {
  CreateNewUser,
  LoginUser,
  GetUser,
  GetQuizData,
  SaveQuizResult,
  InterestResult,
  GetUserId,
  GetCareerQuiz,
  SaveCareerQuizResult,
  GetDashboarCheck,
  GetResult2,
  getResult2Career,
  SaveQuizProgress,
  SaveCarrierQuizProgress,
  GetUserData,
  UpdateUser,
  SubmitFeedback,
  CheckFeedback,
  SaveCarrerData,
  GetCarrerData,
  GetRoadMapData,
  GetIndustry,
  GetStrengthsQuiz,
  SaveStrengthQuizProgress,
  SaveStrengthQuizResult,
  GetQuizDataKids,
  GetCareerQuizKids,
  GetUserAge,
  SaveInterestedCareer,
  GetTests,
  GetSubjects,
  GetTestsData,
  SaveTestProgress,
  UpdateTestData,
  GetTestResultData,

  GetContests,
  SaveContestProgress,
  UpdateContestData,
  GetContestResultData,

  GetLeaderboardData,
  getActivities,
  updateActivityStatus,
  getChallenges,
  submitChallenge,
  getChallengesByStatus,
  getLastSubmittedChallenge,

  UpdateMileStoneStatus,
  GetFeedBackData,
  setCountries,
  GetKidsResult,
  getCareerName,

  GetCareerPath,
  GetSkillTestsData,
  SkillTestProgress,
  UpdateSkillTestData,
  GetSkillTestResult,
  GetUserCommunity,
  GetAllCareerCommunity,
  AddPostToCommunity,
  GetCommunityPosts,
  AddPostLike,
  AddPostComment,

  GetCertificationTest,
  CertificationTestProgress,
  UpdateCertificationTest,
  GetCertificationResult,
  GetCertificationCourse,
  GetCourseOverview,
  UpdateCertificationStatus,
};
