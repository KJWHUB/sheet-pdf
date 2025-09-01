import apiMath from "./data/api-math-response.json";
import apiKorean from "./data/api-ko-response.json";

type Subject = "MATH" | "KOREAN";

/**
 * example API
 */
const getQuestions = async (subject: Subject) => {
  // delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let data;
  if (subject === "MATH") {
    data = apiMath;
  } else if (subject === "KOREAN") {
    data = apiKorean;
  }

  // src/api/data 에서 가져옴
  if (!data) {
    throw new Error("Failed to fetch questions");
  }
  return data.data;
};

const api = {
  getQuestions,
};

export default api;
