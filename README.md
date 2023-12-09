
# Polling and Survey App with Payment Integration

This project involves the development of an advanced Polling and Survey application using the MERN (MongoDB, Express.js, React.js, Node.js) stack. The goal is to integrate payment functionalities, implemented a robust user management system, and created an admin dashboard with role management.

## Live Site Link

[Live Site Link](https://pollinate-01.web.app)

## GitHub Repositories

- [Client Side Code](https://github.com/programming-hero-web-course1/b8a12-client-side-JannatulHappy)
- [Server Side Code](https://github.com/programming-hero-web-course1/b8a12-server-side-JannatulHappy)


#### Package (implement )
 1.Tailwind
 2.Headless Ui
 3.React
 4.Express
 5.Tanstack Query
 6.Mongoose



## if you want to run it in you machine

MONGO_URI=mongodb://localhost:27017/polling-and-survey-app

STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY

5. Start the backend server by running `npm run dev:backend`.
6. Start the frontend server by running `npm run dev:frontend`.



## Deployment

To deploy the application to a production environment, follow these steps:

1. Build the frontend and backend applications by running `npm run build`.
2. Deploy the frontend application to a web server.
3. Deploy the backend application to a Node.js server.



## Challenges Faced

### 1. Payment Integration

Integrating a payment system for users to become pro-user members posed a significant challenge. This involved implementing secure payment gateways, handling successful payments, and updating user roles upon successful transactions.

### 2. User Authentication

Implementing user authentication with email/password and social media authentication required careful consideration of security measures. Generating and storing JWT tokens on the client side, handling authentication for private routes, and integrating social login were key challenges.

### 3. Role Management

Creating user roles such as user, surveyor, admin, and pro-user with different permissions was crucial for effective access control. Implementing role-based access control for dashboard functionalities and managing user roles dynamically were challenges faced during development.

### 4. Dashboard Development

Creating dashboards for different user roles, including admin, surveyor, and pro-user, required careful planning. This involved displaying survey responses with tables and charts, managing survey statuses, and implementing feedback mechanisms for unpublished surveys.

### 5. Access Control (dashboard)

Implementing access control for various user roles in the dashboard was challenging. Admins needed the ability to manage users, change roles, and view survey responses, while surveyors and pro-users had specific permissions related to survey creation, feedback, and participation.


