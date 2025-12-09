async function runPSI() {
  const res = await fetch("http://localhost:3001/run");
  const data = await res.json();

  document.getElementById("size").innerText = data.size;
  document.getElementById("avg").innerText = data.averageAge.toFixed(2);

  const list = document.getElementById("list");
  list.innerHTML = "";

  data.intersection.forEach(id => {
    const li = document.createElement("li");
    li.innerText = id;
    list.appendChild(li);
  });
}
