NS_UI.navbar("inicio");

var grafico = document.getElementById("grafico");
var rotulos = document.getElementById("rotulos");
NS_API.TIPOS.forEach(function (t) {
  grafico.insertAdjacentHTML("beforeend", "<div class=\"grafico__col\"><div class=\"grafico__barra\" data-tipo=\"" + t + "\" style=\"height:0\" title=\"" + t + "\"></div></div>");
  rotulos.insertAdjacentHTML("beforeend", "<span>" + t + "</span>");
});

function carregarEstoque() {
  NS_API.estoque().then(function (e) {
    var max = Math.max.apply(null, NS_API.TIPOS.map(function (t) { return e[t] || 0; })) || 1;
    NS_API.TIPOS.forEach(function (t) {
      var b = grafico.querySelector("[data-tipo=\"" + t + "\"]");
      b.style.height = ((e[t] || 0) / max * 95) + "%";
      b.title = t + ": " + (e[t] || 0) + " bolsas";
    });
  }).catch(function (err) { NS_UI.toast(err.message, "falha"); });
}

function carregarCamara() {
  NS_API.camaraFria().then(function (c) {
    document.getElementById("temp").textContent = c.temperatura + "°";
    document.getElementById("umid").textContent = c.umidade + "%";
    var r = document.getElementById("refrig");
    r.textContent = c.refrigeracao ? "Ligada" : "Desligada";
    r.className = "camara__valor camara__valor--off" + (c.refrigeracao ? "" : "");
    r.style.borderColor = c.refrigeracao ? "var(--verde-btn)" : "var(--vermelho)";
  }).catch(function () {});
}

carregarEstoque(); carregarCamara();
setInterval(function () { carregarEstoque(); carregarCamara(); }, 15000);

// Painel de alerta
var painel = document.getElementById("painel-alerta");
var btnAlerta = document.getElementById("btn-alerta");
var lista = document.getElementById("lista-tipos");
var btnTipos = document.getElementById("btn-tipos");
NS_API.TIPOS.forEach(function (t, i) {
  lista.insertAdjacentHTML("beforeend", "<label><input type=\"checkbox\" value=\"" + t + "\"> Doadores " + t + "</label>");
});
btnAlerta.addEventListener("click", function () {
  painel.hidden = !painel.hidden;
  btnAlerta.setAttribute("aria-expanded", String(!painel.hidden));
});
btnTipos.addEventListener("click", function () {
  var aberta = lista.classList.toggle("aberta");
  btnTipos.setAttribute("aria-expanded", String(aberta));
});
document.getElementById("enviar-alerta").addEventListener("click", function () {
  var tipos = Array.prototype.map.call(lista.querySelectorAll("input:checked"), function (i) { return i.value; });
  if (!tipos.length) return NS_UI.toast("Selecione ao menos um tipo sanguíneo", "falha");
  NS_API.enviarAlerta(tipos).then(function () {
    NS_UI.toast("Alerta enviado com sucesso!", "sucesso");
    painel.hidden = true; btnAlerta.setAttribute("aria-expanded", "false");
    lista.querySelectorAll("input").forEach(function (i) { i.checked = false; });
  }).catch(function (err) { NS_UI.toast(err.message || "Falha ao enviar alerta", "falha"); });
});
