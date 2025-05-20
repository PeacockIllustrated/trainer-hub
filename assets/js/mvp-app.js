// assets/js/mvp-app.js

// Import component initializers if they become separate modules
// For now, modal logic is included directly for simplicity in this MVP file.

// --- Local Storage Database Helper ---
const DB_PREFIX = 'fitflow_mvp_';
const db = {
    read: (key) => {
        const data = localStorage.getItem(DB_PREFIX + key);
        return data ? JSON.parse(data) : [];
    },
    write: (key, data) => {
        localStorage.setItem(DB_PREFIX + key, JSON.stringify(data));
    },
    generateId: () => '_' + Math.random().toString(36).substr(2, 9)
};

// --- State & Initial Data ---
let clients = db.read('clients');
// let workouts = db.read('workouts'); // For later

// --- UI Elements ---
const viewSections = document.querySelectorAll('.view-section');
const navLinks = document.querySelectorAll('.pt-sidebar__nav-link'); // And mobile nav links later

// Client List Elements
const clientListContainer = document.getElementById('clientListContainer');
const noClientsMessage = document.getElementById('noClientsMessage');

// Client Modal Elements
const addEditClientModal = document.getElementById('addEditClientModal');
const clientModalTitle = document.getElementById('clientModalTitle');
const clientForm = document.getElementById('clientForm');
const clientIdInput = document.getElementById('clientId');
const clientNameInput = document.getElementById('clientName');
const clientEmailInput = document.getElementById('clientEmail');
const clientPhoneInput = document.getElementById('clientPhone');
const clientDobInput = document.getElementById('clientDob');
const clientGoalInput = document.getElementById('clientGoal');
const clientMedicalNotesInput = document.getElementById('clientMedicalNotes');
const openAddClientModalBtn = document.getElementById('openAddClientModalBtn');

// Confirmation Modal Elements
const confirmModal = document.getElementById('confirmModal');
const confirmModalTitle = document.getElementById('confirmModalTitle');
const confirmModalMessage = document.getElementById('confirmModalMessage');
const confirmModalConfirmBtn = document.getElementById('confirmModalConfirmBtn');

// Stats
const totalClientsStat = document.getElementById('totalClientsStat');


// --- View Switching Logic ---
function switchView(viewId) {
    viewSections.forEach(section => {
        section.classList.toggle('is-active', section.id === viewId);
    });
    navLinks.forEach(link => {
        link.classList.toggle('is-active', link.dataset.view === viewId);
    });
    // Update URL hash for basic navigation state
    window.location.hash = viewId.replace('View', '').toLowerCase();
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.dataset.view;
        if (viewId) {
            switchView(viewId);
        }
    });
});

// --- Modal Handling (Generic - can be expanded from components/modal.js if using that) ---
function openModal(modalElement) {
    if (modalElement) modalElement.classList.add('is-active');
}
function closeModal(modalElement) {
    if (modalElement) modalElement.classList.remove('is-active');
}

if(addEditClientModal) {
    addEditClientModal.querySelectorAll('.pt-modal__close').forEach(btn => {
        btn.addEventListener('click', () => closeModal(addEditClientModal));
    });
    addEditClientModal.addEventListener('click', (e) => { if(e.target === addEditClientModal) closeModal(addEditClientModal); });
}
if(confirmModal) {
     confirmModal.querySelectorAll('.pt-modal__close').forEach(btn => {
        btn.addEventListener('click', () => closeModal(confirmModal));
    });
    confirmModal.addEventListener('click', (e) => { if(e.target === confirmModal) closeModal(confirmModal); });
}


// --- Client Management ---
function renderClients() {
    if (!clientListContainer) return;
    clientListContainer.innerHTML = ''; // Clear existing list

    if (clients.length === 0) {
        if(noClientsMessage) noClientsMessage.style.display = 'block';
    } else {
        if(noClientsMessage) noClientsMessage.style.display = 'none';
        clients.forEach(client => {
            const clientItem = document.createElement('div');
            clientItem.className = 'pt-client-list-item';
            clientItem.innerHTML = `
                <div class="pt-client-list-item__avatar">${client.name ? client.name.match(/\b(\w)/g).join('').substr(0,2).toUpperCase() : 'N/A'}</div>
                <div class="pt-client-list-item__info">
                    <h4 class="pt-client-list-item__name">${client.name || 'Unnamed Client'}</h4>
                    <p class="pt-client-list-item__meta text-small">${client.goal || 'No goal set'}</p>
                </div>
                <div class="pt-client-list-item__actions">
                    <button class="pt-button pt-button--secondary pt-button--small edit-client-btn" data-id="${client.id}">Edit</button>
                    <button class="pt-button pt-button--destructive pt-button--small delete-client-btn" data-id="${client.id}">Delete</button>
                </div>
            `;
            clientListContainer.appendChild(clientItem);
        });
    }
    updateDashboardStats();
}

function handleClientFormSubmit(e) {
    e.preventDefault();
    const id = clientIdInput.value;
    const clientData = {
        name: clientNameInput.value,
        email: clientEmailInput.value,
        phone: clientPhoneInput.value,
        dob: clientDobInput.value,
        goal: clientGoalInput.value,
        medicalNotes: clientMedicalNotesInput.value,
    };

    if (id) { // Editing existing client
        clients = clients.map(c => c.id === id ? { ...c, ...clientData } : c);
    } else { // Adding new client
        clientData.id = db.generateId();
        clients.push(clientData);
    }
    db.write('clients', clients);
    renderClients();
    closeModal(addEditClientModal);
    clientForm.reset();
}

function openClientModalForEdit(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (client) {
        clientModalTitle.textContent = 'Edit Client';
        clientIdInput.value = client.id;
        clientNameInput.value = client.name || '';
        clientEmailInput.value = client.email || '';
        clientPhoneInput.value = client.phone || '';
        clientDobInput.value = client.dob || '';
        clientGoalInput.value = client.goal || '';
        clientMedicalNotesInput.value = client.medicalNotes || '';
        openModal(addEditClientModal);
    }
}

function handleDeleteClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    confirmModalTitle.textContent = 'Delete Client';
    confirmModalMessage.textContent = `Are you sure you want to delete ${client.name}? This action cannot be undone.`;
    openModal(confirmModal);

    // Remove previous listeners before adding a new one to avoid multiple fires
    const newConfirmBtn = confirmModalConfirmBtn.cloneNode(true);
    confirmModalConfirmBtn.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtn);
    // Re-assign the element reference
    const currentConfirmBtn = document.getElementById('confirmModalConfirmBtn'); 

    currentConfirmBtn.onclick = () => { // Use onclick for simplicity in replacing listener
        clients = clients.filter(c => c.id !== clientId);
        db.write('clients', clients);
        renderClients();
        closeModal(confirmModal);
    };
}


if (openAddClientModalBtn) {
    openAddClientModalBtn.addEventListener('click', () => {
        clientModalTitle.textContent = 'Add New Client';
        clientForm.reset();
        clientIdInput.value = ''; // Ensure ID is cleared for new client
        openModal(addEditClientModal);
    });
}

if (clientForm) {
    clientForm.addEventListener('submit', handleClientFormSubmit);
}

// Event delegation for edit/delete buttons on client list
if (clientListContainer) {
    clientListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-client-btn')) {
            openClientModalForEdit(e.target.dataset.id);
        }
        if (e.target.classList.contains('delete-client-btn')) {
            handleDeleteClient(e.target.dataset.id);
        }
    });
}

// --- Dashboard Stats ---
function updateDashboardStats() {
    if(totalClientsStat) totalClientsStat.textContent = clients.length;
    // activeWorkoutsStat.textContent = ... // Logic for workouts later
}


// --- Initial Setup ---
function initializeApp() {
    // Determine initial view from hash or default to dashboard
    const initialViewId = window.location.hash ? window.location.hash.substring(1) + 'View' : 'dashboardView';
    const validView = document.getElementById(initialViewId) ? initialViewId : 'dashboardView';
    switchView(validView);
    
    renderClients(); // Also updates dashboard stats
    // renderWorkouts(); // For later
}

// Run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeApp);
