document.getElementById("form-login").addEventListener("submit", function (e) {
  e.preventDefault();
  var email = document.getElementById("email").value.trim();
  var senha = document.getElementById("senha").value;
  if (!email || !senha) return NS_UI.toast("Preencha email e senha", "falha");
  NS_API.login(email, senha).then(function (r) {
    sessionStorage.setItem("ns_token", r.token);
    sessionStorage.setItem("ns_usuario", JSON.stringify(r.usuario || {}));
    location.href = "inicio.html";
  }).catch(function (err) { NS_UI.toast(err.message || "Não foi possível entrar", "falha"); });
});
