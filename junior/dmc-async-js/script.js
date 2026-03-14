async function loadUsers() {
  try {
    const list = document.getElementById("list");
    list.innerHTML = "Loading...";

    const response = await fetch("https://jsonplaceholder.typicode.com/users");
    const users = await response.json();

    list.innerHTML = users.map((user) => `<li>${user.name}</li>`).join("");
  } catch (error) {
    console.log("Something went wrong:", error);
  }
}
