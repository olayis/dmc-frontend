const resultDiv = document.querySelector("#result");

async function search() {
  const username = document.getElementById("username").value;

  try {
    resultDiv.innerHTML = "Loading...";
    const userUrl = `https://api.github.com/users/${username}`;
    const response = await fetch(userUrl);

    if (!response.ok) {
      throw new Error("User not found");
    }

    const user = await response.json();
    console.log(user);

    const reposResponse = await fetch(user.repos_url);
    const repos = await reposResponse.json();

    resultDiv.innerHTML = repos.map((repo) => `<p>${repo.name}</p>`).join("");

    // Next: Parallel Requests
  } catch (error) {
    console.error(error.message);
  }
}
