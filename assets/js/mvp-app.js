// assets/js/mvp-app.js

import { initializeThemeSwitcher } from './theme-switcher.js';

// --- Local Storage Database Helper ---
const DB_PREFIX = 'fitflow_mvp_';
const db = {
    read: (key) => { const data = localStorage.getItem(DB_PREFIX + key); return data ? JSON.parse(data) : []; },
    write: (key, data) => { localStorage.setItem(DB_PREFIX + key, JSON.stringify(data)); },
    generateId: () => '_' + Math.random().toString(36).substr(2, 9)
};

// --- Initial Default Data ---
const DEFAULT_EXERCISES = [
    { id: db.generateId(), name: "Squat", description: "Compound lower body exercise.", muscleGroup: "Legs, Glutes" },
    { id: db.generateId(), name: "Bench Press", description: "Compound upper body pushing exercise.", muscleGroup: "Chest, Triceps, Shoulders" },
    { id: db.generateId(), name: "Deadlift", description: "Full body compound exercise.", muscleGroup: "Back, Legs, Glutes, Core" },
    { id: db.generateId(), name: "Overhead Press", description: "Compound shoulder exercise.", muscleGroup: "Shoulders, Triceps" },
    { id: db.generateId(), name: "Barbell Row", description: "Compound upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { id: db.generateId(), name: "Pull-up", description: "Bodyweight upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { id: db.generateId(), name: "Push-up", description: "Bodyweight upper body pushing exercise.", muscleGroup: "Chest, Triceps, Shoulders" },
    { id: db.generateId(), name: "Lunge", description: "Unilateral lower body exercise.", muscleGroup: "Legs, Glutes" },
    { id: db.generateId(), name: "Plank", description: "Core stability exercise.", muscleGroup: "Core" },
    { id: db.generateId(), name: "Bicep Curl", description: "Isolation exercise for biceps.", muscleGroup: "Biceps" },
    { id: db.generateId(), name: "Tricep Extension", description: "Isolation exercise for triceps.", muscleGroup: "Triceps" },
    { id: db.generateId(), name: "Leg Press", description: "Machine-based lower body exercise.", muscleGroup: "Legs, Glutes" },
    { id: db.generateId(), name: "Lat Pulldown", description: "Machine-based upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { id: db.generateId(), name: "Calf Raise", description: "Isolation exercise for calves.", muscleGroup: "Calves" },
    { id: db.generateId(), name: "Russian Twist", description: "Core rotational exercise.", muscleGroup: "Core, Obliques" },
    { id: db.generateId(), name: "Burpee", description: "Full body conditioning exercise.", muscleGroup: "Full Body" },
    { id: db.generateId(), name: "Kettlebell Swing", description: "Full body explosive exercise.", muscleGroup: "Glutes, Hamstrings, Back, Core" },
    { id: db.generateId(), name: "Dumbbell Shoulder Press", description: "Shoulder exercise with dumbbells.", muscleGroup: "Shoulders, Triceps" },
    { id: db.generateId(), name: "Leg Curl", description: "Isolation exercise for hamstrings.", muscleGroup: "Hamstrings" },
    { id: db.generateId(), name: "Leg Extension", description: "Isolation exercise for quadriceps.", muscleGroup: "Quadriceps" }
];

// --- State & Initial Data Loading ---
let clients = db.read('clients');
let exercises = db.read('exercises');
if (exercises.length === 0) {
    exercises = DEFAULT_EXERCISES.map(ex => ({...ex, id: db.generateId()})); // Ensure new IDs if loading defaults
    db.write('exercises', exercises);
}
let workoutTemplates = db.read('workoutTemplates');
let assignedWorkouts = db.read('assignedWorkouts');
let currentTemplateExercises = []; // For building/editing a template

// --- UI Elements (Declared here, assigned in DOMContentLoaded) ---
let bodyElement, viewSections, navLinks, mvpThemeSwitcherElement;
let addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal;
let clientListContainer, noClientsMessage, clientModalTitle, clientForm, openAddClientModalBtn;
let clientIdInput, clientNameInput, clientEmailInput, clientPhoneInput, clientDobInput, clientGoalInput, clientMedicalNotesInput;
let exerciseForm, exerciseIdInput, exerciseNameInput, exerciseDescriptionInput, exerciseMuscleGroupInput;
let exerciseListContainer, noExercisesMessage, cancelEditExerciseBtn;
let openCreateTemplateModalBtn, templateModalTitle, workoutTemplateForm, workoutTemplateIdInput, templateNameInput;
let templateExerciseSelect, addExerciseToTemplateBtn, selectedExercisesForTemplateContainer;
let workoutTemplateListContainer, noWorkoutTemplatesMessage;
let assignWorkoutForm, assignClientSelect, assignTemplateSelect, assignDateInput, assignedWorkoutsLogContainer;
let totalClientsStat, totalWorkoutTemplatesStat;
let confirmModalTitleElem, confirmModalMessageElem, confirmModalConfirmBtnElem, confirmModalCancelBtnElem;
let clientPlanModalTitleElem, clientPlanModalContentElem; // Renamed for clarity

const themesForMvp = [
    { value: 'theme-modern-professional', name: 'Modern & Professional', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-friendly-supportive', name: 'Friendly & Supportive', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-natural-grounded', name: 'Natural & Grounded', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-urban-grit', name: 'Urban Grit & Steel', sidebarLogo: 'GRIT MVP', sidebarUser: 'R. Boulder' },
    { value: 'theme-playful-pop', name: 'Playful & Vibrant Pop', sidebarLogo: 'POP MVP', sidebarUser: 'Zippy' },
    { value: 'theme-tech-data', name: 'Tech & Data Driven', sidebarLogo: 'D4TA MVP', sidebarUser: 'Dr. Byte' },
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance', sidebarLogo: 'Elegance MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist', sidebarLogo: 'LUXE MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-retro-funk', name: 'Retro Funk', sidebarLogo: 'FUNK MVP', sidebarUser: 'PT Admin' }
];


// --- MODAL HANDLING ---
function openModal(modalElement) {
    if (modalElement) modalElement.classList.add('is-active');
    else console.warn("Attempted to open a null modal element.");
}
function closeModal(modalElement) {
    if (modalElement) modalElement.classList.remove('is-active');
    else console.warn("Attempted to close a null modal element.");
}

// --- VIEW SWITCHING ---
function switchView(viewId) {
    if (!viewSections) { console.error("switchView: viewSections not initialized."); return; }
    viewSections.forEach(section => section.classList.toggle('is-active', section.id === viewId));
    if(navLinks) {
        navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.view === viewId));
    }
    window.location.hash = viewId.replace('View', '').toLowerCase();
}

// --- CLIENT MANAGEMENT ---
function renderClients() {
    if (!clientListContainer || !noClientsMessage) {
        console.error("renderClients: clientListContainer or noClientsMessage not initialized.");
        return;
    }
    clientListContainer.innerHTML = '';
    noClientsMessage.style.display = clients.length === 0 ? 'block' : 'none';

    clients.forEach(client => {
        const clientItem = document.createElement('div');
        clientItem.className = 'pt-client-list-item';
        const initials = client.name ? client.name.match(/\b(\w)/g)?.join('').substr(0,2).toUpperCase() || 'N/A' : 'N/A';
        clientItem.innerHTML = `
            <div class="pt-client-list-item__avatar">${initials}</div>
            <div class="pt-client-list-item__info">
                <h4 class="pt-client-list-item__name">${client.name || 'Unnamed Client'}</h4>
                <p class="pt-client-list-item__meta text-small">${client.goal || 'No goal set'}</p>
            </div>
            <div class="pt-client-list-item__actions">
                <button class="pt-button pt-button--accent pt-button--small view-client-plan-btn" data-id="${client.id}">View Plan</button> 
                <button class="pt-button pt-button--secondary pt-button--small edit-client-btn" data-id="${client.id}">Edit</button>
                <button class="pt-button pt-button--destructive pt-button--small delete-client-btn" data-id="${client.id}">Delete</button>
            </div>`;
        clientListContainer.appendChild(clientItem);
    });
    updateDashboardStats();
    populateAssignWorkoutSelects();
}

function handleClientFormSubmit(e) {
    e.preventDefault();
    if (!clientIdInput || !clientNameInput || !clientEmailInput || !clientPhoneInput || 
        !clientDobInput || !clientGoalInput || !clientMedicalNotesInput || 
        !addEditClientModal || !clientForm) {
        console.error("handleClientFormSubmit: One or more required form elements not initialized.");
        return;
    }
    const id = clientIdInput.value;
    const clientData = {
        name: clientNameInput.value, email: clientEmailInput.value, phone: clientPhoneInput.value,
        dob: clientDobInput.value, goal: clientGoalInput.value, medicalNotes: clientMedicalNotesInput.value,
    };
    if (id) { clients = clients.map(c => c.id === id ? { ...c, ...clientData } : c); }
    else { clientData.id = db.generateId(); clients.push(clientData); }
    db.write('clients', clients);
    renderClients();
    closeModal(addEditClientModal);
    clientForm.reset();
    clientIdInput.value = ''; // Explicitly clear hidden ID field
}

function openClientModalForEdit(clientIdToEdit) {
    const client = clients.find(c => c.id === clientIdToEdit);
    if (!client) { console.error(`openClientModalForEdit: Client with ID ${clientIdToEdit} not found.`); return; }
    
    // Check all required DOM elements for the modal
    if (!clientModalTitle || !clientForm || !clientIdInput || !clientNameInput || 
        !clientEmailInput || !clientPhoneInput || !clientDobInput || 
        !clientGoalInput || !clientMedicalNotesInput || !addEditClientModal) {
        console.error("openClientModalForEdit: Modal form elements not initialized. Cannot proceed.");
        // Log which specific element is missing if possible
        if (!clientModalTitle) console.error("clientModalTitle is null");
        if (!clientForm) console.error("clientForm is null");
        // ... and so on for other elements
        return;
    }

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

function handleDeleteClient(clientIdToDelete) {
    const client = clients.find(c => c.id === clientIdToDelete);
    if (!client) { console.error(`handleDeleteClient: Client with ID ${clientIdToDelete} not found.`); return; }
    
    if (!confirmModal || !confirmModalTitleElem || !confirmModalMessageElem || !confirmModalConfirmBtnElem || !confirmModalCancelBtnElem) {
        console.error("handleDeleteClient: Confirm modal elements not initialized.");
        return;
    }
    
    confirmModalTitleElem.textContent = 'Delete Client';
    confirmModalMessageElem.textContent = `Are you sure you want to delete ${client.name}? This action cannot be undone.`;
    
    // Re-clone and re-attach event listener for the confirm button to avoid stale closures
    const newConfirmBtn = confirmModalConfirmBtnElem.cloneNode(true);
    confirmModalConfirmBtnElem.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtnElem);
    confirmModalConfirmBtnElem = newConfirmBtn; 

    confirmModalConfirmBtnElem.onclick = () => {
        clients = clients.filter(c => c.id !== clientIdToDelete);
        db.write('clients', clients);
        renderClients();
        closeModal(confirmModal);
    };
    openModal(confirmModal);
}

// --- EXERCISE MANAGEMENT ---
function renderExercises() {
    if (!exerciseListContainer || !noExercisesMessage || !templateExerciseSelect) {
        console.error("renderExercises: Core elements not initialized.");
        return;
    }
    exerciseListContainer.innerHTML = '';
    templateExerciseSelect.innerHTML = '<option value="">-- Select Exercise --</option>'; // Keep default option
    noExercisesMessage.style.display = exercises.length === 0 ? 'block' : 'none';

    exercises.forEach(ex => {
        const exItem = document.createElement('div'); exItem.className = 'pt-client-list-item'; // Reusing client list item style for consistency
        exItem.innerHTML = `
            <div class="pt-client-list-item__info">
                <h5 class="pt-client-list-item__name" style="font-size:1em;">${ex.name}</h5>
                ${ex.muscleGroup ? `<p class="pt-client-list-item__meta text-small">Group: ${ex.muscleGroup}</p>` : ''}
                ${ex.description ? `<p class="pt-client-list-item__meta text-small">${ex.description.substring(0,50)}...</p>` : ''}
            </div>
            <div class="pt-client-list-item__actions">
                <button class="pt-button pt-button--secondary pt-button--small edit-exercise-btn" data-id="${ex.id}">Edit</button>
                <button class="pt-button pt-button--destructive pt-button--small delete-exercise-btn" data-id="${ex.id}">Del</button>
            </div>`;
        exerciseListContainer.appendChild(exItem);
        
        const option = document.createElement('option');
        option.value = ex.id;
        option.textContent = ex.name;
        templateExerciseSelect.appendChild(option);
    });
    updateDashboardStats(); // Exercises also contribute to template creation possibility
}

function handleExerciseFormSubmit(e) {
    e.preventDefault();
    if (!exerciseForm || !exerciseIdInput || !exerciseNameInput || !exerciseDescriptionInput || !exerciseMuscleGroupInput || !cancelEditExerciseBtn) {
        console.error("handleExerciseFormSubmit: Form elements not initialized.");
        return;
    }
    const id = exerciseIdInput.value;
    const exerciseData = { 
        name: exerciseNameInput.value, 
        description: exerciseDescriptionInput.value, 
        muscleGroup: exerciseMuscleGroupInput.value 
    };

    if (id) { // Editing existing
        exercises = exercises.map(ex => ex.id === id ? { ...ex, ...exerciseData } : ex);
    } else { // Adding new
        exerciseData.id = db.generateId();
        exercises.push(exerciseData);
    }
    db.write('exercises', exercises);
    renderExercises(); // Re-render list and select options
    exerciseForm.reset();
    exerciseIdInput.value = '';
    cancelEditExerciseBtn.style.display = 'none';
}

function openExerciseFormForEdit(exerciseIdToEdit) {
    const exercise = exercises.find(ex => ex.id === exerciseIdToEdit);
    if (!exercise) { console.error(`openExerciseFormForEdit: Exercise ID ${exerciseIdToEdit} not found.`); return; }
    if (!exerciseIdInput || !exerciseNameInput || !exerciseDescriptionInput || !exerciseMuscleGroupInput || !cancelEditExerciseBtn || !exerciseNameInput) {
         console.error("openExerciseFormForEdit: Form elements not initialized."); return;
    }

    exerciseIdInput.value = exercise.id;
    exerciseNameInput.value = exercise.name;
    exerciseDescriptionInput.value = exercise.description || '';
    exerciseMuscleGroupInput.value = exercise.muscleGroup || '';
    cancelEditExerciseBtn.style.display = 'inline-block';
    exerciseNameInput.focus();
}

function handleDeleteExercise(exerciseIdToDelete) {
    const exercise = exercises.find(ex => ex.id === exerciseIdToDelete);
    if (!exercise) { console.error(`handleDeleteExercise: Exercise ID ${exerciseIdToDelete} not found.`); return; }

    // Check if this exercise is used in any templates
    const isUsedInTemplate = workoutTemplates.some(template => 
        template.exercises.some(exInTpl => exInTpl.exerciseId === exerciseIdToDelete)
    );

    let confirmMessage = `Are you sure you want to delete the exercise "${exercise.name}"?`;
    if (isUsedInTemplate) {
        confirmMessage += `\n\nWARNING: This exercise is currently used in one or more workout templates. Deleting it will remove it from those templates.`;
    }
    
    if (!confirmModal || !confirmModalTitleElem || !confirmModalMessageElem || !confirmModalConfirmBtnElem || !confirmModalCancelBtnElem) {
        console.error("handleDeleteExercise: Confirm modal elements not initialized.");
        return;
    }

    confirmModalTitleElem.textContent = 'Delete Exercise';
    confirmModalMessageElem.innerHTML = confirmMessage.replace(/\n/g, '<br>'); // For the warning message formatting
    
    const newConfirmBtn = confirmModalConfirmBtnElem.cloneNode(true);
    confirmModalConfirmBtnElem.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtnElem);
    confirmModalConfirmBtnElem = newConfirmBtn;

    confirmModalConfirmBtnElem.onclick = () => {
        exercises = exercises.filter(ex => ex.id !== exerciseIdToDelete);
        db.write('exercises', exercises);

        // Also remove this exercise from any templates that use it
        workoutTemplates = workoutTemplates.map(template => ({
            ...template,
            exercises: template.exercises.filter(exInTpl => exInTpl.exerciseId !== exerciseIdToDelete)
        }));
        db.write('workoutTemplates', workoutTemplates);

        renderExercises(); // Re-render exercise list & dropdowns
        renderWorkoutTemplates(); // Re-render templates in case one was affected
        closeModal(confirmModal);
    };
    openModal(confirmModal);
}


// --- WORKOUT TEMPLATE MANAGEMENT ---
function renderWorkoutTemplates() {
    if (!workoutTemplateListContainer || !noWorkoutTemplatesMessage || !assignTemplateSelect) {
        console.error("renderWorkoutTemplates: Core elements not initialized.");
        return;
    }
    workoutTemplateListContainer.innerHTML = '';
    assignTemplateSelect.innerHTML = '<option value="">-- Select Template --</option>';
    noWorkoutTemplatesMessage.style.display = workoutTemplates.length === 0 ? 'block' : 'none';

    workoutTemplates.forEach(template => {
        const templateItem = document.createElement('div');
        templateItem.className = 'pt-client-list-item'; // Reusing styles
        templateItem.innerHTML = `
            <div class="pt-client-list-item__info">
                <h5 class="pt-client-list-item__name" style="font-size:1em;">${template.name}</h5>
                <p class="pt-client-list-item__meta text-small">${template.exercises.length} exercise(s)</p>
            </div>
            <div class="pt-client-list-item__actions">
                <button class="pt-button pt-button--secondary pt-button--small edit-template-btn" data-id="${template.id}">Edit</button>
                <button class="pt-button pt-button--destructive pt-button--small delete-template-btn" data-id="${template.id}">Del</button>
            </div>`;
        workoutTemplateListContainer.appendChild(templateItem);

        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        assignTemplateSelect.appendChild(option);
    });
    updateDashboardStats();
}

function renderSelectedExercisesForTemplate() {
    if (!selectedExercisesForTemplateContainer) {
        console.error("renderSelectedExercisesForTemplate: Container not initialized.");
        return;
    }
    selectedExercisesForTemplateContainer.innerHTML = '';
    if (currentTemplateExercises.length === 0) {
        selectedExercisesForTemplateContainer.innerHTML = '<p class="text-muted">No exercises added to template yet.</p>';
        return;
    }
    const list = document.createElement('ul');
    list.style.listStyle = 'none'; list.style.paddingLeft = '0';
    currentTemplateExercises.forEach((exDetails, index) => {
        const exercise = exercises.find(e => e.id === exDetails.exerciseId);
        if (!exercise) return; // Should not happen if data is consistent

        const listItem = document.createElement('li');
        listItem.style.padding = 'var(--spacing-sm) 0';
        listItem.style.borderBottom = '1px solid var(--border-color-light)';
        listItem.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--spacing-xs);">
                <strong>${exercise.name}</strong>
                <button type="button" class="pt-button pt-button--destructive pt-button--small remove-exercise-from-template-btn" data-index="${index}" style="padding:2px 6px; font-size:0.8em;">Remove</button>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap:var(--spacing-sm);">
                <div class="pt-input-group"><label for="sets-${index}" class="text-small">Sets:</label><input type="text" id="sets-${index}" class="pt-input pt-input--small template-exercise-detail" data-index="${index}" data-prop="sets" value="${exDetails.sets || ''}"></div>
                <div class="pt-input-group"><label for="reps-${index}" class="text-small">Reps:</label><input type="text" id="reps-${index}" class="pt-input pt-input--small template-exercise-detail" data-index="${index}" data-prop="reps" value="${exDetails.reps || ''}"></div>
                <div class="pt-input-group"><label for="rest-${index}" class="text-small">Rest (sec):</label><input type="text" id="rest-${index}" class="pt-input pt-input--small template-exercise-detail" data-index="${index}" data-prop="rest" value="${exDetails.rest || ''}"></div>
            </div>`;
        list.appendChild(listItem);
    });
    selectedExercisesForTemplateContainer.appendChild(list);
}

function handleWorkoutTemplateFormSubmit(e) {
    e.preventDefault();
    if (!workoutTemplateForm || !workoutTemplateIdInput || !templateNameInput || !createEditTemplateModal) {
         console.error("handleWorkoutTemplateFormSubmit: Form elements not initialized."); return;
    }
    const id = workoutTemplateIdInput.value;
    const templateData = { 
        name: templateNameInput.value, 
        exercises: [...currentTemplateExercises] // Deep copy current state
    };

    if (templateData.exercises.length === 0) {
        alert("A workout template must contain at least one exercise.");
        return;
    }

    if (id) { // Editing
        workoutTemplates = workoutTemplates.map(wt => wt.id === id ? { ...wt, ...templateData } : wt);
    } else { // Adding new
        templateData.id = db.generateId();
        workoutTemplates.push(templateData);
    }
    db.write('workoutTemplates', workoutTemplates);
    renderWorkoutTemplates(); // Re-render template list and select options
    closeModal(createEditTemplateModal);
    workoutTemplateForm.reset();
    workoutTemplateIdInput.value = '';
    currentTemplateExercises = []; // Reset for next time
}

function openTemplateModalForEdit(templateIdToEdit) {
    const template = workoutTemplates.find(wt => wt.id === templateIdToEdit);
    if (!template) { console.error(`openTemplateModalForEdit: Template ID ${templateIdToEdit} not found.`); return; }

    if (!templateModalTitle || !workoutTemplateForm || !workoutTemplateIdInput || !templateNameInput || !createEditTemplateModal || !templateExerciseSelect) {
        console.error("openTemplateModalForEdit: Modal/form elements not initialized."); return;
    }
    
    templateModalTitle.textContent = 'Edit Workout Template';
    workoutTemplateIdInput.value = template.id;
    templateNameInput.value = template.name;
    currentTemplateExercises = JSON.parse(JSON.stringify(template.exercises)); // Deep copy
    
    renderExercises(); // Ensure exercise select is populated
    renderSelectedExercisesForTemplate(); // Render the exercises already in the template
    openModal(createEditTemplateModal);
}

function handleDeleteTemplate(templateIdToDelete) {
    const template = workoutTemplates.find(wt => wt.id === templateIdToDelete);
    if (!template) { console.error(`handleDeleteTemplate: Template ID ${templateIdToDelete} not found.`); return; }

    if (!confirmModal || !confirmModalTitleElem || !confirmModalMessageElem || !confirmModalConfirmBtnElem || !confirmModalCancelBtnElem) {
        console.error("handleDeleteTemplate: Confirm modal elements not initialized.");
        return;
    }

    confirmModalTitleElem.textContent = 'Delete Workout Template';
    confirmModalMessageElem.textContent = `Are you sure you want to delete the template "${template.name}"? This will also remove any assignments of this template to clients.`;
    
    const newConfirmBtn = confirmModalConfirmBtnElem.cloneNode(true);
    confirmModalConfirmBtnElem.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtnElem);
    confirmModalConfirmBtnElem = newConfirmBtn;

    confirmModalConfirmBtnElem.onclick = () => {
        workoutTemplates = workoutTemplates.filter(wt => wt.id !== templateIdToDelete);
        db.write('workoutTemplates', workoutTemplates);
        // Also remove assignments of this template
        assignedWorkouts = assignedWorkouts.filter(aw => aw.workoutTemplateId !== templateIdToDelete);
        db.write('assignedWorkouts', assignedWorkouts);

        renderWorkoutTemplates();
        renderAssignedWorkouts();
        closeModal(confirmModal);
    };
    openModal(confirmModal);
}

// --- ASSIGN WORKOUT MANAGEMENT ---
function populateAssignWorkoutSelects() {
    if (!assignClientSelect || !assignTemplateSelect) {
        console.error("populateAssignWorkoutSelects: Select elements not initialized.");
        return;
    }
    // Clients
    assignClientSelect.innerHTML = '<option value="">-- Select Client --</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id; option.textContent = client.name;
        assignClientSelect.appendChild(option);
    });
    // Templates are populated by renderWorkoutTemplates
}

function renderAssignedWorkouts() {
    if (!assignedWorkoutsLogContainer) {
        console.error("renderAssignedWorkouts: Container not initialized.");
        return;
    }
    assignedWorkoutsLogContainer.innerHTML = '';
    if (assignedWorkouts.length === 0) {
        assignedWorkoutsLogContainer.innerHTML = '<p class="text-muted">No workouts assigned yet.</p>';
        return;
    }
    const list = document.createElement('ul');
    list.style.listStyle = 'none'; list.style.paddingLeft = '0';
    assignedWorkouts.slice().reverse().forEach(aw => { // Show newest first
        const client = clients.find(c => c.id === aw.clientId);
        const template = workoutTemplates.find(wt => wt.id === aw.workoutTemplateId);
        if (!client || !template) return; // Data integrity issue

        const listItem = document.createElement('li');
        listItem.className = 'pt-client-list-item'; // Re-use styling
        listItem.innerHTML = `
            <div class="pt-client-list-item__info">
                <h5 class="pt-client-list-item__name" style="font-size:1em;">${client.name} - ${template.name}</h5>
                <p class="pt-client-list-item__meta text-small">Assigned for: ${new Date(aw.dateAssigned).toLocaleDateString()} (Status: ${aw.status})</p>
            </div>
            <div class="pt-client-list-item__actions">
                 <button class="pt-button pt-button--destructive pt-button--small delete-assignment-btn" data-id="${aw.id}">Remove</button>
            </div>`;
        list.appendChild(listItem);
    });
    assignedWorkoutsLogContainer.appendChild(list);
}

function handleAssignWorkoutFormSubmit(e) {
    e.preventDefault();
    if (!assignWorkoutForm || !assignClientSelect || !assignTemplateSelect || !assignDateInput) {
        console.error("handleAssignWorkoutFormSubmit: Form elements not initialized."); return;
    }
    if(!assignClientSelect.value || !assignTemplateSelect.value || !assignDateInput.value) {
        alert("Please select a client, a workout template, and a date to assign.");
        return;
    }
    const assignment = { 
        id: db.generateId(), 
        clientId: assignClientSelect.value, 
        workoutTemplateId: assignTemplateSelect.value, 
        dateAssigned: assignDateInput.value, 
        status: 'pending' // Default status
    };
    assignedWorkouts.push(assignment);
    db.write('assignedWorkouts', assignedWorkouts);
    renderAssignedWorkouts();
    assignWorkoutForm.reset();
}

function handleDeleteAssignment(assignmentIdToDelete) {
     if (!confirm("Are you sure you want to remove this workout assignment?")) return;
    assignedWorkouts = assignedWorkouts.filter(aw => aw.id !== assignmentIdToDelete);
    db.write('assignedWorkouts', assignedWorkouts);
    renderAssignedWorkouts();
}

// --- VIEW CLIENT'S PLAN ---
function openViewClientPlanModal(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) { console.error(`openViewClientPlanModal: Client ID ${clientId} not found.`); return; }
    if (!viewClientPlanModal || !clientPlanModalTitleElem || !clientPlanModalContentElem) {
        console.error("openViewClientPlanModal: Modal elements not initialized."); return;
    }

    clientPlanModalTitleElem.textContent = `${client.name}'s Workout Plan`;
    clientPlanModalContentElem.innerHTML = '<p class="text-muted">Loading plan...</p>'; // Placeholder

    const clientAssignments = assignedWorkouts
        .filter(aw => aw.clientId === clientId)
        .sort((a, b) => new Date(a.dateAssigned) - new Date(b.dateAssigned)); // Sort by date

    if (clientAssignments.length === 0) {
        clientPlanModalContentElem.innerHTML = '<p class="text-muted">This client has no workouts assigned yet.</p>';
        openModal(viewClientPlanModal);
        return;
    }

    let planHTML = '';
    clientAssignments.forEach(aw => {
        const template = workoutTemplates.find(wt => wt.id === aw.workoutTemplateId);
        if (template) {
            planHTML += `<div class="pt-card" style="margin-bottom: var(--spacing-md);">`;
            planHTML += `<h4 class="pt-card-title">${template.name} - Assigned: ${new Date(aw.dateAssigned).toLocaleDateString()}</h4>`;
            planHTML += `<ul style="list-style:none; padding-left:0;">`;
            template.exercises.forEach(exDetail => {
                const exerciseInfo = exercises.find(ex => ex.id === exDetail.exerciseId);
                if (exerciseInfo) {
                    planHTML += `<li style="padding: var(--spacing-xs) 0; border-bottom: 1px dashed var(--border-color-light);">
                        <strong>${exerciseInfo.name}</strong>: 
                        ${exDetail.sets || 'N/A'} sets, 
                        ${exDetail.reps || 'N/A'} reps, 
                        ${exDetail.rest || 'N/A'}s rest
                    </li>`;
                }
            });
            planHTML += `</ul></div>`;
        }
    });
    clientPlanModalContentElem.innerHTML = planHTML || '<p class="text-muted">No workout details found for assignments.</p>';
    openModal(viewClientPlanModal);
}

// --- DASHBOARD STATS ---
function updateDashboardStats() {
    if(totalClientsStat) totalClientsStat.textContent = clients.length;
    if(totalWorkoutTemplatesStat) totalWorkoutTemplatesStat.textContent = workoutTemplates.length;
}

// --- INITIALIZE APP ---
function initializeApp() {
    console.log("initializeApp: DOMContentLoaded fired. Document readyState:", document.readyState);

    // Assign all global DOM element variables
    bodyElement = document.body;
    console.log("initializeApp: bodyElement found?", !!bodyElement);

    viewSections = document.querySelectorAll('.view-section');
    console.log("initializeApp: viewSections found count:", viewSections.length);

    navLinks = document.querySelectorAll('.pt-sidebar__nav-link');
    console.log("initializeApp: navLinks found count:", navLinks.length);

    mvpThemeSwitcherElement = document.getElementById('mvpThemeSwitcher');
    console.log("initializeApp: mvpThemeSwitcherElement found?", !!mvpThemeSwitcherElement);

    // Modals
    addEditClientModal = document.getElementById('addEditClientModal');
    console.log("initializeApp: addEditClientModal found?", !!addEditClientModal);
    confirmModal = document.getElementById('confirmModal');
    console.log("initializeApp: confirmModal found?", !!confirmModal);
    createEditTemplateModal = document.getElementById('createEditTemplateModal');
    console.log("initializeApp: createEditTemplateModal found?", !!createEditTemplateModal);
    viewClientPlanModal = document.getElementById('viewClientPlanModal');
    console.log("initializeApp: viewClientPlanModal found?", !!viewClientPlanModal);

    // Client Management Elements
    clientListContainer = document.getElementById('clientListContainer');
    console.log("initializeApp: clientListContainer found?", !!clientListContainer);
    noClientsMessage = document.getElementById('noClientsMessage');
    console.log("initializeApp: noClientsMessage found?", !!noClientsMessage);
    clientModalTitle = document.getElementById('clientModalTitle');
    console.log("initializeApp: clientModalTitle found?", !!clientModalTitle);
    clientForm = document.getElementById('clientForm');
    console.log("initializeApp: clientForm found?", !!clientForm);
    openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
    console.log("initializeApp: openAddClientModalBtn found?", !!openAddClientModalBtn);
    clientIdInput = document.getElementById('clientId');
    console.log("initializeApp: clientIdInput found?", !!clientIdInput);
    clientNameInput = document.getElementById('clientName');
    console.log("initializeApp: clientNameInput found?", !!clientNameInput);
    clientEmailInput = document.getElementById('clientEmail');
    console.log("initializeApp: clientEmailInput found?", !!clientEmailInput);
    clientPhoneInput = document.getElementById('clientPhone');
    console.log("initializeApp: clientPhoneInput found?", !!clientPhoneInput);
    clientDobInput = document.getElementById('clientDob');
    console.log("initializeApp: clientDobInput found?", !!clientDobInput);
    clientGoalInput = document.getElementById('clientGoal');
    console.log("initializeApp: clientGoalInput found?", !!clientGoalInput);
    clientMedicalNotesInput = document.getElementById('clientMedicalNotes');
    console.log("initializeApp: clientMedicalNotesInput found?", !!clientMedicalNotesInput);

    // Exercise Management Elements
    exerciseForm = document.getElementById('exerciseForm');
    console.log("initializeApp: exerciseForm found?", !!exerciseForm);
    exerciseIdInput = document.getElementById('exerciseId');
    console.log("initializeApp: exerciseIdInput found?", !!exerciseIdInput);
    exerciseNameInput = document.getElementById('exerciseName');
    console.log("initializeApp: exerciseNameInput found?", !!exerciseNameInput);
    exerciseDescriptionInput = document.getElementById('exerciseDescription');
    console.log("initializeApp: exerciseDescriptionInput found?", !!exerciseDescriptionInput);
    exerciseMuscleGroupInput = document.getElementById('exerciseMuscleGroup');
    console.log("initializeApp: exerciseMuscleGroupInput found?", !!exerciseMuscleGroupInput);
    exerciseListContainer = document.getElementById('exerciseListContainer');
    console.log("initializeApp: exerciseListContainer found?", !!exerciseListContainer);
    noExercisesMessage = document.getElementById('noExercisesMessage');
    console.log("initializeApp: noExercisesMessage found?", !!noExercisesMessage);
    cancelEditExerciseBtn = document.getElementById('cancelEditExerciseBtn');
    console.log("initializeApp: cancelEditExerciseBtn found?", !!cancelEditExerciseBtn);

    // Workout Template Elements
    openCreateTemplateModalBtn = document.getElementById('openCreateTemplateModalBtn');
    console.log("initializeApp: openCreateTemplateModalBtn found?", !!openCreateTemplateModalBtn);
    templateModalTitle = document.getElementById('templateModalTitle');
    console.log("initializeApp: templateModalTitle found?", !!templateModalTitle);
    workoutTemplateForm = document.getElementById('workoutTemplateForm');
    console.log("initializeApp: workoutTemplateForm found?", !!workoutTemplateForm);
    workoutTemplateIdInput = document.getElementById('workoutTemplateId');
    console.log("initializeApp: workoutTemplateIdInput found?", !!workoutTemplateIdInput);
    templateNameInput = document.getElementById('templateName');
    console.log("initializeApp: templateNameInput found?", !!templateNameInput);
    templateExerciseSelect = document.getElementById('templateExerciseSelect');
    console.log("initializeApp: templateExerciseSelect found?", !!templateExerciseSelect);
    addExerciseToTemplateBtn = document.getElementById('addExerciseToTemplateBtn');
    console.log("initializeApp: addExerciseToTemplateBtn found?", !!addExerciseToTemplateBtn);
    selectedExercisesForTemplateContainer = document.getElementById('selectedExercisesForTemplateContainer');
    console.log("initializeApp: selectedExercisesForTemplateContainer found?", !!selectedExercisesForTemplateContainer);
    workoutTemplateListContainer = document.getElementById('workoutTemplateListContainer');
    console.log("initializeApp: workoutTemplateListContainer found?", !!workoutTemplateListContainer);
    noWorkoutTemplatesMessage = document.getElementById('noWorkoutTemplatesMessage');
    console.log("initializeApp: noWorkoutTemplatesMessage found?", !!noWorkoutTemplatesMessage);
    
    // Assign Workout Elements
    assignWorkoutForm = document.getElementById('assignWorkoutForm');
    console.log("initializeApp: assignWorkoutForm found?", !!assignWorkoutForm);
    assignClientSelect = document.getElementById('assignClientSelect');
    console.log("initializeApp: assignClientSelect found?", !!assignClientSelect);
    assignTemplateSelect = document.getElementById('assignTemplateSelect');
    console.log("initializeApp: assignTemplateSelect found?", !!assignTemplateSelect);
    assignDateInput = document.getElementById('assignDate');
    console.log("initializeApp: assignDateInput found?", !!assignDateInput);
    assignedWorkoutsLogContainer = document.getElementById('assignedWorkoutsLogContainer');
    console.log("initializeApp: assignedWorkoutsLogContainer found?", !!assignedWorkoutsLogContainer);

    // Dashboard Stats Elements
    totalClientsStat = document.getElementById('totalClientsStat');
    console.log("initializeApp: totalClientsStat found?", !!totalClientsStat);
    totalWorkoutTemplatesStat = document.getElementById('totalWorkoutTemplatesStat');
    console.log("initializeApp: totalWorkoutTemplatesStat found?", !!totalWorkoutTemplatesStat);

    // Confirm Modal Specific Elements
    confirmModalTitleElem = document.getElementById('confirmModalTitle');
    console.log("initializeApp: confirmModalTitleElem found?", !!confirmModalTitleElem);
    confirmModalMessageElem = document.getElementById('confirmModalMessage');
    console.log("initializeApp: confirmModalMessageElem found?", !!confirmModalMessageElem);
    confirmModalConfirmBtnElem = document.getElementById('confirmModalConfirmBtn');
    console.log("initializeApp: confirmModalConfirmBtnElem found?", !!confirmModalConfirmBtnElem);
    confirmModalCancelBtnElem = document.getElementById('confirmModalCancelBtn'); // Added for completeness
    console.log("initializeApp: confirmModalCancelBtnElem found?", !!confirmModalCancelBtnElem);


    // Client Plan Modal Specific Elements
    clientPlanModalTitleElem = document.getElementById('clientPlanModalTitle');
    console.log("initializeApp: clientPlanModalTitleElem found?", !!clientPlanModalTitleElem);
    clientPlanModalContentElem = document.getElementById('clientPlanModalContent');
    console.log("initializeApp: clientPlanModalContentElem found?", !!clientPlanModalContentElem);


    // Initialize Theme Switcher
    if (mvpThemeSwitcherElement && bodyElement) {
        initializeThemeSwitcher(themesForMvp, mvpThemeSwitcherElement, bodyElement, (themeValue, themeObject) => {
            const modalsToTheme = [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal];
            modalsToTheme.forEach(modal => {
                if (modal) {
                    themesForMvp.forEach(t => modal.classList.remove(t.value)); // Remove all theme classes
                    modal.classList.add(themeValue); // Add current theme class
                }
            });
            // Update sidebar logo/user based on theme object if they exist
            const sidebarLogoElem = document.querySelector('.pt-sidebar__logo');
            const sidebarUserElem = document.querySelector('.pt-sidebar__user-name');
            const sidebarAvatarElem = document.querySelector('.pt-sidebar__user-avatar');
            if(sidebarLogoElem && themeObject && themeObject.sidebarLogo) sidebarLogoElem.textContent = themeObject.sidebarLogo;
            if(sidebarUserElem && themeObject && themeObject.sidebarUser) sidebarUserElem.textContent = themeObject.sidebarUser;
            if(sidebarAvatarElem && themeObject && themeObject.sidebarUser) sidebarAvatarElem.textContent = themeObject.sidebarUser.match(/\b(\w)/g)?.join('').substr(0,2).toUpperCase() || 'PT';

        });
    } else if (themesForMvp.length > 0 && bodyElement) { // Fallback if switcher element is missing but themes are defined
        bodyElement.className = ''; bodyElement.classList.add(themesForMvp[0].value);
        bodyElement.style.backgroundColor = 'var(--background-color)'; bodyElement.style.color = 'var(--text-color)';
    } else {
        console.warn("initializeApp: Theme switcher or body element not found. Theming might not work correctly.");
    }

    // Setup Modal Close Listeners
    [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal].forEach(modal => {
        if (modal) {
            modal.querySelectorAll('.pt-modal__close').forEach(btn => {
                btn.addEventListener('click', () => closeModal(modal));
            });
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); }); // Backdrop click
        } else {
            // console.warn("initializeApp: One of the modal elements is null, cannot attach close listeners.");
        }
    });
    if(confirmModalCancelBtnElem) { // Specific cancel button for confirm modal
        confirmModalCancelBtnElem.addEventListener('click', () => closeModal(confirmModal));
    }
    
    // --- Attach Event Listeners (with null checks for elements) ---

    // Navigation
    if(navLinks) navLinks.forEach(link => {
        link.addEventListener('click', (e) => { e.preventDefault(); switchView(link.dataset.view); });
    });

    // Client Management
    if (openAddClientModalBtn) {
        openAddClientModalBtn.addEventListener('click', () => {
            if(clientModalTitle) clientModalTitle.textContent = 'Add New Client'; 
            if(clientForm) clientForm.reset(); 
            if(clientIdInput) clientIdInput.value = ''; // Clear hidden ID
            openModal(addEditClientModal);
        });
    } else { console.warn("initializeApp: openAddClientModalBtn not found."); }

    if (clientForm) {
        clientForm.addEventListener('submit', handleClientFormSubmit);
    } else { console.warn("initializeApp: clientForm not found."); }

    if (clientListContainer) {
        clientListContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-client-btn')) openClientModalForEdit(e.target.dataset.id);
            else if (e.target.classList.contains('delete-client-btn')) handleDeleteClient(e.target.dataset.id);
            else if (e.target.classList.contains('view-client-plan-btn')) openViewClientPlanModal(e.target.dataset.id);
        });
    } else { console.warn("initializeApp: clientListContainer not found. Client list interactions will fail."); }

    // Exercise Management
    if (exerciseForm) {
        exerciseForm.addEventListener('submit', handleExerciseFormSubmit);
    } else { console.warn("initializeApp: exerciseForm not found."); }

    if (cancelEditExerciseBtn) {
        cancelEditExerciseBtn.addEventListener('click', () => { 
            if(exerciseForm) exerciseForm.reset(); 
            if(exerciseIdInput) exerciseIdInput.value = ''; 
            cancelEditExerciseBtn.style.display = 'none'; 
        });
    } else { console.warn("initializeApp: cancelEditExerciseBtn not found."); }
    
    if (exerciseListContainer) {
        exerciseListContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-exercise-btn')) openExerciseFormForEdit(e.target.dataset.id);
            else if (e.target.classList.contains('delete-exercise-btn')) handleDeleteExercise(e.target.dataset.id);
        });
    } else { console.warn("initializeApp: exerciseListContainer not found. Exercise list interactions will fail."); }

    // Workout Template Management
    if (openCreateTemplateModalBtn) {
        openCreateTemplateModalBtn.addEventListener('click', () => {
            if(templateModalTitle) templateModalTitle.textContent = 'Create Workout Template';
            if(workoutTemplateForm) workoutTemplateForm.reset();
            if(workoutTemplateIdInput) workoutTemplateIdInput.value = '';
            currentTemplateExercises = [];
            renderExercises(); // Ensure fresh exercise list in dropdown
            renderSelectedExercisesForTemplate();
            openModal(createEditTemplateModal);
        });
    } else { console.warn("initializeApp: openCreateTemplateModalBtn not found."); }

    if (workoutTemplateForm) {
        workoutTemplateForm.addEventListener('submit', handleWorkoutTemplateFormSubmit);
    } else { console.warn("initializeApp: workoutTemplateForm not found."); }

    if (addExerciseToTemplateBtn) {
        addExerciseToTemplateBtn.addEventListener('click', () => {
            if (!templateExerciseSelect) { console.error("addExerciseToTemplateBtn: templateExerciseSelect not found."); return; }
            const exerciseId = templateExerciseSelect.value;
            if (exerciseId) {
                if (!currentTemplateExercises.find(ex => ex.exerciseId === exerciseId)) {
                    currentTemplateExercises.push({ exerciseId, sets: '', reps: '', rest: '' });
                    renderSelectedExercisesForTemplate();
                } else {
                    alert("This exercise is already in the template.");
                }
            }
            templateExerciseSelect.value = ""; // Reset select
        });
    } else { console.warn("initializeApp: addExerciseToTemplateBtn not found."); }

    if (selectedExercisesForTemplateContainer) {
        selectedExercisesForTemplateContainer.addEventListener('click', (e) => { // For remove button
            if (e.target.classList.contains('remove-exercise-from-template-btn')) {
                const indexToRemove = parseInt(e.target.dataset.index);
                if (!isNaN(indexToRemove) && indexToRemove >= 0 && indexToRemove < currentTemplateExercises.length) {
                    currentTemplateExercises.splice(indexToRemove, 1);
                    renderSelectedExercisesForTemplate();
                }
            }
        });
        selectedExercisesForTemplateContainer.addEventListener('input', (e) => { // For sets/reps/rest inputs
            if(e.target.classList.contains('template-exercise-detail')) {
                const index = parseInt(e.target.dataset.index); 
                const prop = e.target.dataset.prop;
                if(currentTemplateExercises[index] && prop) {
                    currentTemplateExercises[index][prop] = e.target.value;
                    // No need to db.write here, only on template save
                }
            }
        });
    } else { console.warn("initializeApp: selectedExercisesForTemplateContainer not found."); }

    if (workoutTemplateListContainer) {
        workoutTemplateListContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-template-btn')) openTemplateModalForEdit(e.target.dataset.id);
            else if (e.target.classList.contains('delete-template-btn')) handleDeleteTemplate(e.target.dataset.id);
        });
    } else { console.warn("initializeApp: workoutTemplateListContainer not found."); }
    
    // Assign Workout
    if (assignWorkoutForm) {
        assignWorkoutForm.addEventListener('submit', handleAssignWorkoutFormSubmit);
    } else { console.warn("initializeApp: assignWorkoutForm not found."); }

    if (assignedWorkoutsLogContainer) {
        assignedWorkoutsLogContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-assignment-btn')) handleDeleteAssignment(e.target.dataset.id);
        });
    } else { console.warn("initializeApp: assignedWorkoutsLogContainer not found."); }

    // Initial Renders & View Setup
    renderClients(); 
    renderExercises(); 
    renderWorkoutTemplates(); 
    renderAssignedWorkouts(); 
    
    const initialViewId = window.location.hash ? window.location.hash.substring(1).toLowerCase() + 'View' : 'dashboardView';
    const validView = document.getElementById(initialViewId) ? initialViewId : 'dashboardView'; // Fallback to dashboard
    switchView(validView);
    
    console.log("MVP App Initialized Successfully.");
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', initializeApp);
