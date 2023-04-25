const formularioRegistro = document.querySelector('#formulario-registro');

formularioRegistro.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nombre = document.querySelector('#registroNombre').value;
    const apellidos = document.querySelector('#registroApellido').value;
    const correo = document.querySelector('#registroEmail').value;
    const password = document.querySelector('#registroPassword').value;
    const rol = document.querySelector('input[name="rol"]:checked').value;

    const response = await fetch('/autol/singup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, apellidos, correo, password, rol })
    });

    const data = await response.json();
    console.log(data);

    if (response.ok) {
        alert(data.message);
    } else {
        alert(data.error);
    }
});
