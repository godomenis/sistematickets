class Message {
    constructor(nombre, email, mensaje, prioridad) {
        this.id = Date.now();
        this.nombre = nombre;
        this.email = email;
        this.mensaje = mensaje;
        this.prioridad = prioridad;
        this.fecha = new Date();
        this.leido = false;
    }

    toHTML() {
        const fechaFormato = this.fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const clasePrioridad = `ticket ticket-${this.prioridad} ${this.leido ? 'leido' : ''}`;

        return `
            <div class="${clasePrioridad}" data-id="${this.id}">
                <div class="ticket-header">
                    <div>
                        <p class="ticket-titulo">${this.nombre}</p>
                        <p class="ticket-email">✉️ ${this.email}</p>
                        <p class="ticket-fecha">📅 ${fechaFormato}</p>
                    </div>
                    <span class="ticket-prioridad prioridad-${this.prioridad}">${this.prioridad}</span>
                </div>
                <p class="ticket-mensaje">${this.mensaje}</p>
                <div class="ticket-acciones">
                    <button class="btn btn-sm btn-leido" onclick="app.toggleLeido(${this.id})">
                        ${this.leido ? '👁️ Marcar no leído' : '📖 Marcar leído'}
                    </button>
                    <button class="btn btn-sm btn-eliminar" onclick="app.eliminarTicket(${this.id})">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }

    summary() {
        return {
            id: this.id,
            nombre: this.nombre,
            email: this.email,
            prioridad: this.prioridad,
            fecha: this.fecha,
            leido: this.leido,
            palabrasCount: this.contarPalabras()
        };
    }

    contarPalabras() {
        return this.mensaje.split(/\s+/).filter(palabra => palabra.length > 0).length;
    }
}

class SistemaTickets {
    constructor() {
        this.tickets = [];
        this.filtroActual = 'todos';
        this.cargarDelStorage();
        this.inicializarEventos();
        this.renderizar();
    }

    inicializarEventos() {
        const form = document.getElementById('ticketForm');
        form.addEventListener('submit', (e) => this.manejarSubmit(e));

        const botonesNombre = document.getElementById('nombre');
        botonesNombre.addEventListener('blur', () => this.validarNombre());

        const email = document.getElementById('email');
        email.addEventListener('blur', () => this.validarEmail());

        const mensaje = document.getElementById('mensaje');
        mensaje.addEventListener('blur', () => this.validarMensaje());

        const busqueda = document.getElementById('busqueda');
        busqueda.addEventListener('input', (e) => this.buscar(e.target.value));

        const botonesFiltro = document.querySelectorAll('.filtro-btn');
        botonesFiltro.forEach(btn => {
            btn.addEventListener('click', (e) => this.aplicarFiltro(e.target.dataset.filtro));
        });
    }

    manejarSubmit(e) {
        e.preventDefault();

        if (!this.validarNombre() || !this.validarEmail() || !this.validarMensaje()) {
            this.mostrarAlerta('Por favor, corrige los errores', 'danger');
            return;
        }

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const prioridad = document.getElementById('prioridad').value;
        const mensaje = document.getElementById('mensaje').value.trim();

        const nuevoTicket = new Message(nombre, email, mensaje, prioridad);
        this.agregarTicket(nuevoTicket);

        this.mostrarAlerta('✅ Ticket creado exitosamente', 'success');
        e.target.reset();
        document.getElementById('prioridad').value = 'normal';

        this.limpiarErrores();
    }

    validarNombre() {
        const nombre = document.getElementById('nombre').value.trim();
        const errorNombre = document.getElementById('errorNombre');

        if (nombre.length < 3) {
            errorNombre.classList.remove('d-none');
            return false;
        } else {
            errorNombre.classList.add('d-none');
            return true;
        }
    }

    validarEmail() {
        const email = document.getElementById('email').value.trim();
        const errorEmail = document.getElementById('errorEmail');
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!regexEmail.test(email)) {
            errorEmail.classList.remove('d-none');
            return false;
        } else {
            errorEmail.classList.add('d-none');
            return true;
        }
    }

    validarMensaje() {
        const mensaje = document.getElementById('mensaje').value.trim();
        const errorMensaje = document.getElementById('errorMensaje');

        if (mensaje.length < 10) {
            errorMensaje.classList.remove('d-none');
            return false;
        } else {
            errorMensaje.classList.add('d-none');
            return true;
        }
    }

    limpiarErrores() {
        document.getElementById('errorNombre').classList.add('d-none');
        document.getElementById('errorEmail').classList.add('d-none');
        document.getElementById('errorMensaje').classList.add('d-none');
    }

    mostrarAlerta(mensaje, tipo) {
        const alerta = document.getElementById('alertaForm');
        alerta.textContent = mensaje;
        alerta.className = `alert alert-${tipo}`;
        alerta.classList.remove('d-none');

        setTimeout(() => {
            alerta.classList.add('d-none');
        }, 3000);
    }

    agregarTicket(ticket) {
        this.tickets.unshift(ticket);
        this.guardarEnStorage();
        this.renderizar();
    }

    eliminarTicket(id) {
        this.tickets = this.tickets.filter(ticket => ticket.id !== id);
        this.guardarEnStorage();
        this.renderizar();
    }

    toggleLeido(id) {
        const ticket = this.tickets.find(t => t.id === id);
        if (ticket) {
            ticket.leido = !ticket.leido;
            this.guardarEnStorage();
            this.renderizar();
        }
    }

    aplicarFiltro(filtro) {
        this.filtroActual = filtro;

        const botonesNombre = document.querySelectorAll('.filtro-btn');
        botonesNombre.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filtro === filtro) {
                btn.classList.add('active');
            }
        });

        this.renderizar();
    }

    buscar(termino) {
        const terminoLower = termino.toLowerCase();

        if (terminoLower === '') {
            this.renderizar();
            return;
        }

        const ticketsFiltrados = this.tickets.filter(ticket => {
            return ticket.nombre.toLowerCase().includes(terminoLower) ||
                   ticket.email.toLowerCase().includes(terminoLower) ||
                   ticket.mensaje.toLowerCase().includes(terminoLower);
        });

        this.renderizarTickets(ticketsFiltrados);
    }

    obtenerTicketsFiltrados() {
        let ticketsFiltrados = this.tickets;

        if (this.filtroActual !== 'todos') {
            ticketsFiltrados = ticketsFiltrados.filter(ticket => ticket.prioridad === this.filtroActual);
        }

        return ticketsFiltrados;
    }

    contarUrgentes() {
        return this.tickets.filter(ticket => ticket.prioridad === 'alta').length;
    }

    actualizarEstadisticas() {
        const total = this.tickets.length;
        const noLeidos = this.tickets.filter(t => !t.leido).length;
        const urgentes = this.contarUrgentes();

        document.getElementById('statsTotal').textContent = total;
        document.getElementById('statsNoLeidos').textContent = noLeidos;
        document.getElementById('statsUrgentes').textContent = urgentes;

        const contadorUrgentes = document.getElementById('contadorUrgentes');
        if (urgentes > 0) {
            contadorUrgentes.textContent = `${urgentes} Urgente${urgentes > 1 ? 's' : ''}`;
            contadorUrgentes.classList.remove('d-none');
        } else {
            contadorUrgentes.classList.add('d-none');
        }
    }

    renderizarTickets(ticketsAMostrar) {
        const contenedor = document.getElementById('listaTíckets');

        if (ticketsAMostrar.length === 0) {
            contenedor.innerHTML = '<p class="text-muted text-center py-5">No hay tickets que coincidan con tu búsqueda.</p>';
            return;
        }

        const html = ticketsAMostrar.map(ticket => ticket.toHTML()).join('');
        contenedor.innerHTML = html;
    }

    renderizar() {
        const ticketsFiltrados = this.obtenerTicketsFiltrados();
        this.renderizarTickets(ticketsFiltrados);
        this.actualizarEstadisticas();
    }

    guardarEnStorage() {
        const datos = this.tickets.map(ticket => ({
            id: ticket.id,
            nombre: ticket.nombre,
            email: ticket.email,
            mensaje: ticket.mensaje,
            prioridad: ticket.prioridad,
            fecha: ticket.fecha.toISOString(),
            leido: ticket.leido
        }));
        localStorage.setItem('tickets', JSON.stringify(datos));
    }

    cargarDelStorage() {
        const datos = localStorage.getItem('tickets');
        if (datos) {
            const ticketsGuardados = JSON.parse(datos);
            this.tickets = ticketsGuardados.map(data => {
                const ticket = new Message(data.nombre, data.email, data.mensaje, data.prioridad);
                ticket.id = data.id;
                ticket.fecha = new Date(data.fecha);
                ticket.leido = data.leido;
                return ticket;
            });
        }
    }

    exportarJSON() {
        const datos = {
            totalTickets: this.tickets.length,
            urgentes: this.contarUrgentes(),
            generadoEn: new Date().toLocaleString('es-ES'),
            tickets: this.tickets.map(t => t.summary())
        };
        console.log(JSON.stringify(datos, null, 2));
        return datos;
    }
}

const app = new SistemaTickets();

console.log('Sistema de Tickets inicializado correctamente');
console.log('Para ver los datos del localStorage, usa: localStorage.getItem("tickets")');

app: window.app = app;