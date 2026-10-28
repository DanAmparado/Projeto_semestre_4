NS_UI.navbar("doacao");
NS_UI.mascaraCpf(document.getElementById("cpf"));

var $ = function (id) { return document.getElementById(id); };
var modo = "novo";
var doadorOk = false;       // doador salvo (novo) ou encontrado (recorrente)
var btnPrincipal = $("btn-principal"), btnDoar = $("btn-doar"), status = $("status");

document.querySelectorAll(".aba").forEach(function (a) {
  a.addEventListener("click", function () {
    modo = a.dataset.modo; doadorOk = false;
    document.querySelectorAll(".aba").forEach(function (x) { x.setAttribute("aria-selected", String(x === a)); });
    btnPrincipal.textContent = modo === "novo" ? "Salvar" : "Conferir";
    $("form-doacao").reset(); atualizarElegibilidade();
  });
});

// Regras de exemplo — a validação oficial deve ficar no back-end.
function elegivel() {
  var peso = +$("peso").value, oxi = +$("oxi").value, bpm = +$("bpm").value, pmin = +$("pmin").value, pmax = +$("pmax").value;
  if (!(peso && oxi && bpm && pmin && pmax)) return null;
  return peso >= 50 && oxi >= 95 && bpm >= 50 && bpm <= 100 && pmax >= 100 && pmax <= 180 && pmin >= 60 && pmin <= 100;
}

function atualizarElegibilidade() {
  var ok = elegivel();
  status.className = "pode-doar__status" + (ok === null ? "" : ok ? " pode-doar__status--sim" : " pode-doar__status--nao");
  status.textContent = ok === null ? "--" : ok ? "Sim" : "Não";
  btnDoar.disabled = !(ok && doadorOk);
}
["peso", "altura", "oxi", "bpm", "pmin", "pmax"].forEach(function (id) { $(id).addEventListener("input", atualizarElegibilidade); });

function dadosDoador() {
  return { nome: $("nome").value.trim(), cpf: $("cpf").value, rg: $("rg").value.trim(), nascimento: $("nasc").value };
}

btnPrincipal.addEventListener("click", function () {
  if (!NS_UI.cpfValido($("cpf").value)) return NS_UI.toast("CPF inválido", "falha");
  if (modo === "novo") {
    var d = dadosDoador();
    if (!d.nome || !d.rg || !d.nascimento) return NS_UI.toast("Preencha todos os dados do doador", "falha");
    NS_API.cadastrarDoador(d).then(function () {
      doadorOk = true; atualizarElegibilidade(); NS_UI.toast("Doador salvo com sucesso!", "sucesso");
    }).catch(function (e) { NS_UI.toast(e.message, "falha"); });
  } else {
    NS_API.buscarDoador($("cpf").value).then(function (d) {
      $("nome").value = d.nome || ""; $("rg").value = d.rg || ""; $("nasc").value = d.nascimento || "";
      doadorOk = true; atualizarElegibilidade(); NS_UI.toast("Doador encontrado!", "sucesso");
    }).catch(function (e) { doadorOk = false; atualizarElegibilidade(); NS_UI.toast(e.message, "falha"); });
  }
});

btnDoar.addEventListener("click", function () {
  var dados = {
    cpf: $("cpf").value, peso: +$("peso").value, altura: +$("altura").value, oxigenacao: +$("oxi").value,
    bpm: +$("bpm").value, pressaoMinima: +$("pmin").value, pressaoMaxima: +$("pmax").value
  };
  NS_API.registrarDoacao(dados).then(function () {
    NS_UI.toast("Doação registrada com sucesso!", "sucesso");
    $("form-doacao").reset(); doadorOk = false; atualizarElegibilidade();
  }).catch(function (e) { NS_UI.toast(e.message || "Falha ao registrar doação", "falha"); });
});
