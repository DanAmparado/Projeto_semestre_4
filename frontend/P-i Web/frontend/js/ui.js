(function () {
  var MENU = [
    { id: "inicio", texto: "Início", href: "inicio.html" },
    { id: "doacao", texto: "Nova doação", href: "nova-doacao.html" },
    { id: "relatorios", texto: "Relatórios", href: "relatorios.html" },
    { id: "cadastro", texto: "Novo cadastro", href: "novo-cadastro.html" }
  ];

  function exigirLogin() {
    if (!sessionStorage.getItem("ns_token")) location.replace("login.html");
  }

  function navbar(ativo) {
    exigirLogin();
    var el = document.getElementById("navbar");
    el.className = "navbar";
    el.innerHTML = "<a class=\"navbar__logo\" href=\"inicio.html\"><img src=\"../assets/img/logo.svg\" alt=\"Nosso Sangue\"></a>" +
      "<nav aria-label=\"Principal\"><ul class=\"navbar__menu\">" +
      MENU.map(function (m) {
        return "<li><a href=\"" + m.href + "\"" + (m.id === ativo ? " aria-current=\"page\"" : "") + ">" + m.texto + "</a></li>";
      }).join("") + "</ul></nav>";
  }

  var tempo;
  function toast(msg, tipo) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.className = "toast toast--" + (tipo === "falha" ? "falha" : "sucesso");
    t.textContent = msg; t.hidden = false;
    clearTimeout(tempo);
    tempo = setTimeout(function () { t.hidden = true; }, 3500);
  }

  function mascaraCpf(input) {
    input.addEventListener("input", function () {
      var v = input.value.replace(/\D/g, "").slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      input.value = v;
    });
  }

  function mascaraTelefone(input) {
    input.addEventListener("input", function () {
      var v = input.value.replace(/\D/g, "").slice(0, 11);
      v = v.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
      input.value = v;
    });
  }

  function cpfValido(cpf) {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    for (var t = 9; t < 11; t++) {
      var soma = 0;
      for (var i = 0; i < t; i++) soma += cpf[i] * (t + 1 - i);
      var d = ((soma * 10) % 11) % 10;
      if (d !== Number(cpf[t])) return false;
    }
    return true;
  }

  window.NS_UI = { navbar: navbar, toast: toast, mascaraCpf: mascaraCpf, mascaraTelefone: mascaraTelefone, cpfValido: cpfValido };
})();
