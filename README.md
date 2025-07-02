# PlaySphere - Backend

<p>
  <strong>Backend for a modern video-sharing platform, built with Node.js, Express, and MongoDB.</strong>
</p>

---

## 🌟 About The Project

**PlaySphere** is a robust, scalable, and secure backend system designed to power a full-featured video-sharing platform analogous to YouTube. It handles everything from user authentication and channel management to complex social interactions like subscriptions, likes, and comments.

The core of PlaySphere is a set of well-defined RESTful APIs that provide a complete foundation for any front-end application to build a rich user experience upon.

---

## ✨ Key Features

This project implements a wide array of features, making it a comprehensive solution for a video-sharing platform:

-   **👤 User & Channel Management**:
    -   Secure user registration with password hashing (`bcrypt`).
    -   JWT-based authentication (`access` and `refresh` tokens).
    -   HTTP-only cookies for secure token storage.
    -   User profile and channel information management.
    -   Cloud-based avatar and cover image uploads via **Cloudinary**.

-   **🎬 Video Content Management**:
    -   Full CRUD (Create, Read, Update, Delete) for videos.
    -   Video and thumbnail uploads to **Cloudinary**.
    -   Paginated fetching of videos with search, sort, and filter capabilities.
    -   Toggle video publish status.

-   **❤️ Social Engagement Features**:
    -   **Subscriptions**: Users can subscribe/unsubscribe to channels. View subscriber and subscribed-to channel lists.
    -   **Likes**: Toggle likes on videos, comments, and tweets.
    -   **Comments**: Full CRUD for comments on videos, with pagination.
    -   **Tweets**: A simple, tweet-like feature for short text-based posts by users.

-   **🎶 Content Organization**:
    -   **Playlists**: Users can create, update, delete, and manage their own video playlists.
    -   Add or remove videos from playlists.

-   **📊 Creator Dashboard**:
    -   An analytics endpoint for channel owners to view key stats:
        -   Total Subscribers
        -   Total Video Views
        -   Total Likes
        -   Total Videos

---

## 🛠️ Technology Stack

PlaySphere is built with a modern, robust, and scalable technology stack:

-   **Core**: Node.js, Express.js
-   **Database**: MongoDB
-   **ODM**: Mongoose (with `mongoose-aggregate-paginate-v2` for efficient pagination)
-   **Authentication**: JSON Web Tokens (JWT)
-   **File Handling**: Multer & Cloudinary
-   **Utilities**:
    -   `dotenv` for environment variable management.
    -   `cookie-parser` for handling request cookies.
    -   `bcrypt` for password hashing.
    -   Custom `ApiError`, `ApiResponse`, and `asyncHandler` utilities for professional error handling and response consistency.

---

## 📁 Project Structure

The project follows a modular and scalable structure, designed for maintainability.
```bash
play_sphere-main/
├── src/
│   ├── controllers/      # Business logic for each feature
│   ├── db/               # Database connection logic
│   ├── middlewares/      # Express middlewares (auth, multer, error handling)
│   ├── models/           # Mongoose data models and schemas
│   ├── routes/           # API route definitions
│   ├── utils/            # Utility classes and functions (ApiError, ApiResponse, etc.)
│   ├── app.js            # Main Express app configuration
│   ├── constants.js      # Global constants
│   └── index.js          # Application entry point
├── .env                  # Environment variables
├── .gitignore
├── package.json
└── README.md
```
---

## 🚀 API Endpoints

The API is versioned under `/api/v1`. All protected routes require a `Bearer <accessToken>` in the `Authorization` header or an `accessToken` cookie.

| Feature | Method | Endpoint | Protected | Description |
| :--- | :--- | :--- | :--- | :--- |
| **HealthCheck** | `GET` | `/healthcheck` | No | Checks if the application is running. |
| **Users** | `POST` | `/users/register` | No | Register a new user with an avatar and optional cover image. |
| | `POST` | `/users/login` | No | Log in a user with email/username and password. |
| | `POST` | `/users/logout` | Yes | Log out the current user and clear their refresh token. |
| | `POST` | `/users/refresh-token` | No | Get a new access token using a refresh token. |
| | `POST` | `/users/change-password` | Yes | Change the current user's password. |
| | `GET` | `/users/current-user` | Yes | Get the profile of the currently authenticated user. |
| | `PATCH` | `/users/update-account` | Yes | Update the current user's full name and email. |
| | `PATCH` | `/users/avatar` | Yes | Update the current user's avatar image. |
| | `PATCH` | `/users/cover-image` | Yes | Update the current user's cover image. |
| | `GET` | `/users/c/:username` | Yes | Get a user's public channel profile by username. |
| | `GET` | `/users/history` | Yes | Get the authenticated user's watch history. |
| **Videos** | `POST` | `/videos` | Yes | Publish a new video with a title, description, and thumbnail. |
| | `GET` | `/videos` | Yes | Get all videos (paginated, sortable, searchable). |
| | `GET` | `/videos/:videoId` | Yes | Get a single video by its ID. |
| | `PATCH` | `/videos/:videoId` | Yes | Update video details (title, description, thumbnail). |
| | `DELETE`| `/videos/:videoId` | Yes | Delete a video. |
| | `PATCH` | `/videos/toggle/publish/:videoId` | Yes | Toggle the publish status of a video. |
| **Tweets** | `POST` | `/tweets` | Yes | Create a new tweet. |
| | `GET` | `/tweets/user/:userId` | Yes | Get all tweets for a specific user. |
| | `PATCH` | `/tweets/:tweetId` | Yes | Update an existing tweet. |
| | `DELETE`| `/tweets/:tweetId` | Yes | Delete a tweet. |
| **Subscriptions**| `POST` | `/subscriptions/c/:channelId` | Yes | Toggle subscription to a channel. |
| | `GET` | `/subscriptions/c/:channelId` | Yes | Get a list of a channel's subscribers. |
| | `GET` | `/subscriptions/u/:subscriberId`| Yes | Get a list of channels a user is subscribed to. |
| **Likes** | `POST` | `/likes/toggle/v/:videoId` | Yes | Toggle a like on a video. |
| | `POST` | `/likes/toggle/c/:commentId`| Yes | Toggle a like on a comment. |
| | `POST` | `/likes/toggle/t/:tweetId` | Yes | Toggle a like on a tweet. |
| | `GET` | `/likes/videos` | Yes | Get all videos liked by the authenticated user. |
| **Comments** | `POST` | `/comments/:videoId` | Yes | Add a new comment to a video. |
| | `GET` | `/comments/:videoId` | Yes | Get all comments for a video (paginated). |
| | `PATCH` | `/comments/c/:commentId` | Yes | Update a specific comment. |
| | `DELETE`| `/comments/c/:commentId` | Yes | Delete a specific comment. |
| **Playlists** | `POST` | `/playlist` | Yes | Create a new playlist. |
| | `GET` | `/playlist/:playlistId` | Yes | Get a playlist by its ID. |
| | `PATCH` | `/playlist/:playlistId` | Yes | Update a playlist's details (name, description). |
| | `DELETE`| `/playlist/:playlistId` | Yes | Delete a playlist. |
| | `PATCH` | `/playlist/add/:videoId/:playlistId` | Yes | Add a video to a playlist. |
| | `PATCH` | `/playlist/remove/:videoId/:playlistId`| Yes | Remove a video from a playlist. |
| | `GET` | `/playlist/user/:userId` | Yes | Get all playlists for a specific user. |
| **Dashboard** | `GET` | `/dashboard/stats` | Yes | Get stats for the authenticated user's channel. |
| | `GET` | `/dashboard/videos` | Yes | Get all videos uploaded by the authenticated user's channel. |

---

## 🏁 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

-   Node.js (v14 or higher)
-   npm or yarn
-   MongoDB (local instance or a cloud service like MongoDB Atlas)
-   A Cloudinary account for media storage.

### Installation & Setup

1.  **Clone the repository**
    ```sh
    git clone https://github.com/thesinghaman/play_sphere.git
    cd play_sphere
    ```

2.  **Install dependencies**
    ```sh
    npm install
    ```

3.  **Set up environment variables**
    Create a `.env` file in the root of the project and add the following variables:
    ```env
    PORT = 8000
    CORS_ORIGIN = *
    NODE_ENV = development
    
    MONGOOSE_URI=your_mongodb_connection_string

    ACCESS_TOKEN_SECRET=your-strong-access-token-secret
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=your-stronger-refresh-token-secret
    REFRESH_TOKEN_EXPIRY=10d

    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    ```

4.  **Run the development server**
    ```sh
    npm run dev
    ```
    The server will start on the port specified in your `.env` file.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---
