import axios from "axios";

const SearchUser = (token, data) => {
  if (token) {
    return axios.post("/api/search", data, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the Authorization header
      },
    });
  } else {
    return axios.post("/api/search", data);
  }
};

// New functions to fetch and add children
const GetUserChildren = async () => {
  const token = localStorage.getItem("token"); // Adjust based on your auth token storage

  return axios.get("/api/children", {
    headers: {
      Authorization: `Bearer ${token}`, // Include the token in the Authorization header
    },
  });
};

const GetUserData = (token) => {
  return axios.get("/api/getUserData", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


export default {
  SearchUser,
  GetUserChildren,
  GetUserData,
};
