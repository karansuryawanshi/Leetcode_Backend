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

app.post("/leetcode-recent", async (req, res) => {
  const { username } = req.body;

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
        stats: details?.stats,
        beatPercentage: details?.acRate,
      };
    })
  );

  res.json({ recent: detailedResults });
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
