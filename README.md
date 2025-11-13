# 💬 ChatX

A real-time **1:1 chat application** built with the **MERN stack** (MongoDB, Express, React Native, Node.js) and **Socket.IO**.  
This project includes JWT authentication, online presence indicators, typing status, and persistent message history.

---

## 🛠️ Tech Stack

| Frontend | Backend | Database | Tools |
|-----------|----------|-----------|--------|
| React Native (Expo) | Node.js + Express | MongoDB (Mongoose) | Socket.IO, Axios, JWT, bcrypt.js, AsyncStorage |

Additional Libraries:
- React Navigation  
- React Context  
- Socket.IO Client  

---

## 📦 Features

✅ **Full JWT Authentication** – Secure user registration & login  
💬 **1:1 Real-Time Chat** – Instant messaging powered by Socket.IO  
🟢 **Online Presence** – View real-time online/offline user status  
⌨️ **Typing Indicator** – Know when the other user is typing  
🕒 **Message Persistence** – Chat history saved & loaded from MongoDB  
🏠 **Home Screen Preview** – Last message preview, sorted by most recent  
🔐 **Logout Functionality** – Securely end a user session  

---

## 📸 Screenshots  

### 🔐 Auth Screens (Login & Register)
![Auth Screens](https://github.com/kusheen8/ChatX/blob/main/Assets/auth.png)

### 👥 User List (Online Status)
![User List](https://github.com/kusheen8/ChatX/blob/main/Assets/userlist.png)

### 💬 Chat Screen (Messages + Typing)
![Chat Screen](https://github.com/kusheen8/ChatX/blob/main/Assets/chat.png)

---

## 🚀 Local Setup  

This project requires **two terminals**: one for the backend and one for the frontend.

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/kusheen8/ChatX.git
cd ChatX
2️⃣ Backend Setup (Terminal 1)
cd server
npm install


Create a .env file inside /server:

PORT=5000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your-very-strong-secret-key-here
CLIENT_URL=http://localhost:8081


Run the backend server:

npm start

3️⃣ Frontend Setup (Terminal 2)
cd mobile
npm install
npx expo install react-dom react-native-web


Create a .env file inside /mobile:

API_URL=http://localhost:5000/api
SERVER_URL=http://localhost:5000


Run the frontend:

npx expo start -c


Press w to open in your browser or scan the QR code with the Expo Go app.

4️⃣ How to Test

Register two users (e.g., “UserA” and “UserB”).

Open an incognito window and log in as the second user.

Chat between them and see messages, typing, and online status update in real time. 🎉

🧑‍💻 Author

Kusheen Dhar
