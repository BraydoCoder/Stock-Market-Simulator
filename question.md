# Stock Market Simulator — Full Specification Questions

Answer every question below before the PRD is expanded. Leave any question blank if you don't know yet — that becomes a decision to make during development.

---

## 1. Project Context

1. What is the name of the application?
2. Is this being submitted as a school assignment, a personal portfolio project, or both?
3. What class or course is this for (if school)?
4. What is the hard deadline for a working demo?
5. What is the hard deadline for the final submission?
6. Will you be presenting this to a class, a teacher, or both?
7. Will the project be graded? If so, what are the grading criteria?
8. Is this a solo project or a group project?
9. If group — how many people, and who owns which parts?
10. Do you have a GitHub repo already set up for this?
11. Will the project be deployed publicly (e.g. GitHub Pages, Vercel, Netlify) or run locally?
12. Is there a specific hosting platform you're required to use?

---

## 2. Tech Stack

13. Are you using plain HTML/CSS/JS, or any framework (React, Vue, etc.)?
14. Will you use any CSS framework (Bootstrap, Tailwind, etc.) or write all CSS yourself?
15. Are you allowed to use external libraries (Chart.js, lodash, etc.)?
16. Will you use a bundler (Webpack, Vite) or keep everything as plain script tags?
17. Do you have a Node.js backend, or is this frontend-only?
18. If frontend-only, where is all state being stored (localStorage, sessionStorage, in-memory)?
19. Are you using any JavaScript module system (ES Modules / import-export) or plain scripts?
20. Will you use TypeScript or plain JavaScript?
21. Are there any tools or technologies your school/teacher requires or forbids?
22. What code editor or IDE are you using?

---

## 3. API & Data

23. Which stock data API are you using (Finnhub, Alpha Vantage, Twelve Data, etc.)?
24. Do you already have an API key, or do you still need to register?
25. Where will your API key be stored (env file, config file, hardcoded for now)?
26. Is real-time (live) stock data required, or is delayed/static data acceptable?
27. Will you use WebSocket for real-time price streaming, or just HTTP polling?
28. If polling — how often should prices refresh (every 5s, 10s, 30s)?
29. How many stocks will be available to trade in the simulator?
30. Will the stock list be hardcoded (fixed set of tickers) or dynamic (searchable by user)?
31. What specific tickers/companies do you want included by default?
32. Will you show historical price charts? If so, how far back (1 day, 1 week, 1 month)?
33. Do you need company fundamentals (P/E ratio, market cap, description)? Or just price data?
34. Do you need news articles per stock, or just price information?
35. What happens if the API is down or rate-limited? Is mock/fallback data required?
36. Will mock data be hardcoded or loaded from a local JSON file?
37. Do you need to handle multiple API providers as fallbacks, or just one?
38. Will the API key be visible in client-side code (acceptable for a school project)?

---

## 4. User Accounts & Authentication

39. Do users need to create accounts, or is the simulator anonymous/guest-only?
40. If accounts exist — how do users sign up (username only, email, Google login)?
41. Is there a teacher/admin account type with different permissions?
42. Can a teacher reset a student's portfolio or balance?
43. Can a teacher set the simulation start date, end date, and starting balance?
44. If no accounts — how are users identified for the leaderboard (nickname on launch)?
45. Can a user change their display name mid-simulation?
46. Will progress persist across devices, or only on the same browser/device?
47. Is there a way to export or download portfolio data?
48. Can a user reset their own portfolio and start over?

---

## 5. Portfolio & Trading

49. What is the starting virtual cash balance ($10,000 as stated, or different)?
50. Can the starting balance be configured differently per class/session?
51. Are whole shares only, or can users buy fractional shares?
52. What is the minimum number of shares per trade (1 share minimum)?
53. Is there a maximum number of shares per single trade?
54. Is there a transaction fee? If so, how much ($1 flat, % of trade, etc.)?
55. Does the transaction fee apply to both buying and selling?
56. Can a user go into debt/negative balance, or is it blocked?
57. What happens if a stock's price drops so low the portfolio value goes negative?
58. Can a user hold shares of the same stock bought at different prices (multiple lots)?
59. How is average cost calculated when buying the same stock multiple times?
60. Can a user sell partial shares of a position (e.g., own 10, sell 5)?
61. Is short selling allowed (selling shares you don't own)?
62. Are market orders the only order type, or do limit orders exist?
63. If limit orders — what happens if the limit is never hit before simulation ends?
64. Does the portfolio show unrealized gain/loss, realized gain/loss, or both?
65. Is there a transaction history log showing every past trade?
66. How far back does transaction history go (all time, last 30 trades, etc.)?
67. Can a user filter or sort their transaction history?
68. Will there be a "net worth over time" chart tracking total portfolio value?
69. How is total portfolio value calculated (cash + current market value of all holdings)?

---

## 6. Stock Browser & Search

70. How will stocks be displayed on the browser page (list, cards, table)?
71. What information is shown per stock in the browser (symbol, name, price, % change)?
72. Can users search stocks by company name or ticker symbol?
73. Can users filter stocks by sector (tech, healthcare, energy, etc.)?
74. Can users sort stocks (by price, % change, alphabetical)?
75. Will there be a "Watchlist" feature where users can save favourite stocks?
76. Will there be "trending" or "most traded" stocks highlighted on the browser?
77. How many stocks appear per page? Is there pagination or infinite scroll?
78. Will there be a stock detail page with a full price chart and company info?
79. On the stock detail page, what timeframes can users select for the chart (1D, 1W, 1M)?

---

## 7. Dashboard / Home Screen

80. What is shown on the dashboard when a user first logs in?
81. Does the dashboard show a summary of the user's portfolio value?
82. Does it show today's gain/loss vs. yesterday?
83. Does it show the user's leaderboard rank?
84. Does it show recent transactions?
85. Does it show a news feed or market summary?
86. Does it show the user's current XP and level?
87. Does it show active achievements or recently unlocked badges?
88. Is the dashboard the default landing page, or is there a separate login/welcome screen?
89. Will there be a market status indicator (market open / market closed / simulated)?

---

## 8. Leaderboard

90. Is the leaderboard class-wide (same session) or global (all users ever)?
91. What metric determines rank — total portfolio value, % gain, or something else?
92. Does the leaderboard update in real time, or only at set intervals?
93. How many users are shown on the leaderboard (top 10, top 20, everyone)?
94. Can a user see their own rank even if they're not in the top N?
95. Is the leaderboard visible to all users at all times, or only the teacher can view it?
96. Will the leaderboard show historical snapshots (e.g., rank on Day 1, Day 7, Day 30)?
97. Is there a way to filter the leaderboard (by class period, by date, etc.)?
98. Will the leaderboard show each user's starting vs. current balance?
99. Will there be a "winner" announced at the end of the simulation period?

---

## 9. Achievement & XP System

100. What are all the achievements/badges you want in the game?
101. What actions earn XP (buying, selling, diversifying, daily login, etc.)?
102. How much XP does each action earn?
103. How many investor levels are there (e.g., 5 levels: Novice → Expert)?
104. What XP thresholds separate each level?
105. Does levelling up give any in-game reward or is it purely cosmetic?
106. Are achievements permanent once unlocked, or can they be lost?
107. Do achievements appear as pop-up notifications when unlocked?
108. Is there a dedicated achievements page where users can see all locked/unlocked badges?
109. Will achievements be tied to the leaderboard (e.g., show badges next to username)?
110. Are there secret/hidden achievements users can discover on their own?
111. What are the badge names and descriptions for each achievement?
112. Is there a daily login streak reward?

---

## 10. Onboarding & Tutorial

113. Is there a first-time tutorial that walks new users through the app?
114. Is the tutorial skippable?
115. Is the tutorial a step-by-step guided overlay, a video, or a separate tutorial mode?
116. What concepts does the tutorial cover (how to buy, how to read charts, what gain/loss means)?
117. Will there be in-app tooltips explaining financial terms (e.g., hover over "P/E ratio")?
118. Is there a help/FAQ page within the app?
119. Will there be sample trades or a "practice round" before the real simulation starts?
120. Can users replay the tutorial after completing it?

---

## 11. UI & Visual Design

121. What is the overall visual theme (dark mode, light mode, or both)?
122. Do you have a colour palette in mind, or should it be decided during design?
123. What is the primary accent colour (green for finance, blue for trust, etc.)?
124. Will the app have a navigation bar at the top, sidebar, or bottom nav?
125. What pages/routes will exist in the app?
126. Will the app be single-page (SPA with JS routing) or multi-page (separate HTML files)?
127. Are there any design references or apps whose look you want to inspire this project?
128. Will the UI be fully responsive (mobile-friendly), or desktop-only?
129. Will there be loading spinners or skeleton screens while data fetches?
130. Will there be animations on page transitions or component updates?
131. Will gain values pulse green and loss values pulse red when prices change?
132. What font will be used (Google Fonts, system font, custom)?
133. Should the UI feel more like a game (bold, colourful) or a real trading platform (minimal, professional)?

---

## 12. Notifications & Feedback

134. Will there be in-app toast notifications (e.g., "Trade successful!", "Insufficient balance")?
135. Where do toast notifications appear (top-right, bottom-center, etc.)?
136. How long do notifications stay visible before disappearing?
137. Will there be a persistent notification bell/inbox for achievement unlocks?
138. Will there be an alert if a stock the user owns moves more than X% in a single day?
139. Are sound effects used for trades, achievements, or level-ups?
140. Is there a way for users to disable notifications or sounds?

---

## 13. Simulation Settings

141. Is the simulation time-based (30-day period) or open-ended (no end date)?
142. Who controls the simulation start and end — the teacher or the student?
143. Can the teacher pause or reset the simulation mid-session?
144. Does the simulation use real-world market hours (9:30am–4pm EST weekdays only)?
145. Or does the simulator run 24/7 with continuous price updates?
146. Will prices freeze outside of real market hours, or keep simulating movement?
147. Will there be simulated market events (e.g., flash crash, bull run) as educational moments?
148. Can the simulation be run in "fast forward" mode (accelerated time)?
149. Is there a way to set the simulation to a historical period (e.g., simulate trading in 2020)?

---

## 14. Educational Content

150. Will there be in-app educational lessons or articles (e.g., "What is a stock?")?
151. Will concepts be explained as they're encountered (contextual learning)?
152. Will there be a glossary of financial terms users can reference?
153. Will there be quizzes or knowledge checks built into the app?
154. Should educational content be skippable for users who already know the basics?
155. Will there be an "Insight" card after each trade showing what the user learned?
156. Is financial literacy content teacher-assigned, or self-directed by the student?

---

## 15. Data & Storage

157. Where is all user data stored (localStorage, sessionStorage, server database)?
158. What exactly is saved in localStorage (portfolio, balance, XP, achievements, transaction history)?
159. What is the maximum amount of data localStorage can hold — is this a concern?
160. Will data be exported/imported (e.g., download save file, upload to another device)?
161. What happens if localStorage is cleared — does the user lose all progress?
162. Should the app warn users before clearing data?
163. Will there be an auto-save mechanism, or is data saved after every action?
164. Is there a versioning system for the save data schema in case the structure changes?

---

## 16. Performance & Reliability

165. How many concurrent users is the app expected to handle (just you, a class of 30, more)?
166. Does the API rate limit become a problem if 30 students use it simultaneously?
167. Will each student use their own API key, or share one?
168. How should the app behave when the API rate limit is hit?
169. What is the acceptable page load time target?
170. Will images, fonts, and assets be optimised for fast loading?
171. Will the app work offline at all (service worker / offline cache)?
172. Are there any browser compatibility requirements (Chrome only, or all modern browsers)?

---

## 17. Accessibility

173. Does the app need to meet any accessibility standard (WCAG 2.1 AA)?
174. Will all interactive elements be keyboard-navigable?
175. Will colour choices meet contrast ratio requirements for visually impaired users?
176. Will screen reader support (ARIA labels) be implemented?
177. Will font sizes be adjustable or respect browser zoom?
178. Are there any specific accessibility requirements from your school?

---

## 18. Security

179. Will the API key be exposed in client-side JavaScript (acceptable for now)?
180. Is there any user authentication that needs to be secured?
181. Will any sensitive user data be stored (name, email, school info)?
182. Should input fields be sanitized to prevent XSS?
183. Is there a content security policy or other browser security header needed?

---

## 19. Testing

184. Will you write automated tests (unit tests, integration tests)?
185. What testing framework would you use if so (Jest, Mocha, etc.)?
186. Will you do manual QA testing before submission?
187. Who will test the app — just you, classmates, or the teacher?
188. What are the most critical features that absolutely must be tested before demo day?
189. Will you test the fallback/mock data mode explicitly?
190. Will you test edge cases like buying more shares than you can afford, selling 0 shares, etc.?

---

## 20. Deployment & Submission

191. Where will the final project be hosted (GitHub Pages, Vercel, Netlify, local only)?
192. Is a live URL required for submission, or can you submit a ZIP of the code?
193. Does the project need a README explaining how to run it?
194. Will your teacher need to run it locally? If so, are there setup instructions?
195. Do you need to submit a video demo along with the code?
196. Are there any file size or file count limits for submission?
197. Will the project be open source, or kept private?

---

## 21. Future / Version 2 (Nice to Know)

198. After this project is done, do you plan to continue building it?
199. Are there features you want in v2 that are out of scope now (crypto, options, multiplayer)?
200. Do you want the codebase structured to make those future features easy to add?
201. Is there a feature you cut from this version that you wish you could include?
202. Would you eventually add a real backend (Node, Firebase, Supabase) to replace localStorage?
203. Would you want a mobile app version in the future?
