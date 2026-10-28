NS_UI.navbar("relatorios");

function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

document.getElementById("form-relatorio").addEventListener("submit", function (e) {
  e.preventDefault();
  var tipo = document.getElementById("tipo").value, ini = document.getElementById("ini").value, fim = document.getElementById("fim").value;
  if (!tipo || !ini || !fim) return NS_UI.toast("Preencha tipo e período", "falha");
  if (ini > fim) return NS_UI.toast("A data inicial deve ser anterior à final", "falha");
  var box = document.getElementById("resultado");
  box.innerHTML = "<p class=\"resultado__vazio\">Gerando relatório...</p>";
  NS_API.relatorio(tipo, ini, fim).then(function (r) {
    box.innerHTML = "<h3 class=\"titulo-secao\">" + esc(r.titulo || tipo) + "</h3><table class=\"tabela\"><thead><tr>" +
      r.colunas.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      r.linhas.map(function (l) { return "<tr>" + l.map(function (c) { return "<td>" + esc(String(c)) + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody></table>";
  }).catch(function (err) {
    box.innerHTML = "<p class=\"resultado__vazio\">Não foi possível gerar o relatório</p>";
    NS_UI.toast(err.message, "falha");
  });
});
