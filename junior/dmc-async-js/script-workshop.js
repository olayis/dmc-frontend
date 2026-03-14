// console.log("1");
// console.log("2");
// setTimeout(() => {
//   console.log("3");
// }, 3000);
// console.log("4");
// console.log("5");

// function fetchData(callback) {
//   setTimeout(() => {
//     callback("Success!");
//   }, 1000);
// }

// fetchData((data) => {
//   console.log(data);
// });

// setTimeout(() => {
//   console.log("Step 1");

//   setTimeout(() => {
//     console.log("Step 2");

//     setTimeout(() => {
//       console.log("Step 3");
//     }, 1000);
//   }, 1000);
// }, 1000);

// const promise = new Promise((resolve, reject) => {
//   //   setTimeout(() => {
//   //     resolve("Success!");
//   //   }, 1000);

//   reject("Oops! An error occurred");
// });

// promise
//   .then((result) => console.log(result))
//   .catch((error) => console.log(error));

// api/get-users
function getUsers() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Users fetched successfully!");
    }, 3000);
  });
}

async function run() {
  const result = await getUsers();

  console.log(result);
}

run();

// https://jsonplaceholder.typicode.com/users

// const button = document.querySelector("button");

async function loadUsers() {
  const list = document.getElementById("list");
  list.innerHTML = "Loading...";

  // Implement call
  const response = await fetch("https://jsonplaceholder.typicode.com/users");
  const users = await response.json();

  list.innerHTML = "";

  for (const user of users) {
    const li = document.createElement("li");
    li.textContent = user.name;
    list.appendChild(li);
  }
}

// button.addEventListener("click", async () => {
//   try {
//     await loadUsers();
//   } catch (error) {
//     console.log("Something went wrong:", error);
//   }
// });
