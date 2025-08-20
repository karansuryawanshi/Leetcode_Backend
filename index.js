// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/leetcode-profile", async (req, res) => {
  const { username } = req.body;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
              ranking
              userAvatar
              reputation
            }
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `,
      variables: { username },
    }),
  });

  const data = await response.json();
  res.json(data);
});

// server.js
// app.post("/leetcode-recent", async (req, res) => {
//   const { username } = req.body;

//   const response = await fetch("https://leetcode.com/graphql", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       query: `
//         query recentSubmissions($username: String!) {
//           recentAcSubmissionList(username: $username, limit: 10) {
//             id
//             title
//             titleSlug
//             timestamp
//           }
//         }

//       `,
//       variables: { username },
//     }),
//   });

//   const data = await response.json();
//   res.json(data);
// });

// server.js
app.post("/leetcode-recent", async (req, res) => {
  const { username } = req.body;

  // 1️⃣ Get recent solved submissions
  const recentRes = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query recentSubmissions($username: String!) {
          recentAcSubmissionList(username: $username, limit: 10) {
            id
            title
            titleSlug
            timestamp
          }
        }
      `,
      variables: { username },
    }),
  });

  const recentData = await recentRes.json();
  const recentList = recentData.data.recentAcSubmissionList || [];

  // 2️⃣ Fetch extra details for each problem
  const detailedResults = await Promise.all(
    recentList.map(async (q) => {
      const detailsRes = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query questionDetail($titleSlug: String!) {
              question(titleSlug: $titleSlug) {
                questionId
                title
                difficulty
                stats
                acRate
              }
            }
          `,
          variables: { titleSlug: q.titleSlug },
        }),
      });

      const detailsData = await detailsRes.json();
      const details = detailsData.data.question;

      return {
        id: q.id,
        title: q.title,
        titleSlug: q.titleSlug,
        timestamp: q.timestamp,
        difficulty: details?.difficulty,
        questionId: details?.questionId,
        stats: details?.stats, // JSON string with total/accepted submissions
        beatPercentage: details?.acRate, // % of people solved
      };
    })
  );

  res.json({ recent: detailedResults });
});


// server.js
app.post("/leetcode-calendar", async (req, res) => {
  const { username } = req.body;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query userProfileCalendar($username: String!, $year: Int) {
          matchedUser(username: $username) {
            userCalendar(year: $year) {
              submissionCalendar
            }
          }
        }
      `,
      variables: { username, year: new Date().getFullYear() },
    }),
  });

  const data = await response.json();
  res.json(data);
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
