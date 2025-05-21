// assets/js/mvp-app.js
import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeAccordions } from './components/accordion.js';
import { FITFLOW_THEMES_CONFIG } from './themes-config.js'; // Import shared themes
import { auth, db } from './firebase-config.js'; // Import Firebase auth and db
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Local Storage Database Helper (TEMPORARY - will be phased out for Firestore) ---
const DB_PREFIX = 'fitflow_mvp_';
const dbLocalStorage = { // Renamed to avoid conflict with Firestore 'db'
    read: (key) => {
        const data = localStorage.getItem(DB_PREFIX + key);
        if (!data) return [];
        try {
            const parsedData = JSON.parse(data);
            if (Array.isArray(parsedData)) return parsedData;
            else { console.warn(`dbLocalStorage.read: Data for key "${DB_PREFIX + key}" is not an array. Clearing.`); localStorage.removeItem(DB_PREFIX + key); return []; }
        } catch (error) { console.error(`dbLocalStorage.read: Error parsing for key "${DB_PREFIX + key}":`, error); localStorage.removeItem(DB_PREFIX + key); return []; }
    },
    write: (key, data) => {
        try { localStorage.setItem(DB_PREFIX + key, JSON.stringify(data)); }
        catch (error) { console.error(`dbLocalStorage.write: Error for key "${DB_PREFIX + key}":`, error); }
    },
    generateId: () => '_' + Math.random().toString(36).substr(2, 9)
};

// --- Initial Default Data ---
const DEFAULT_EXERCISES = [
    { id: dbLocalStorage.generateId(), name: "Squat", description: "Compound lower body exercise.", muscleGroup: "Legs, Glutes" },
    { id: dbLocalStorage.generateId(), name: "Bench Press", description: "Compound upper body pushing exercise.", muscleGroup: "Chest, Triceps, Shoulders" },
    { id: dbLocalStorage.generateId(), name: "Deadlift", description: "Full body compound exercise.", muscleGroup: "Back, Legs, Glutes, Core" },
    { id: dbLocalStorage.generateId(), name: "Overhead Press", description: "Compound shoulder exercise.", muscleGroup: "Shoulders, Triceps" },
    { id: dbLocalStorage.generateId(), name: "Barbell Row", description: "Compound upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { id: dbLocalStorage.generateId(), name: "Pull-up", description: "Bodyweight upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { id: dbLocalStorage.generateId(), name: "Push-up", description: "Bodyweight upper body pushing exercise.", muscleGroup: "Chest, Triceps, Shoulders" },
    { id: dbLocalStorage.generateId(), name: "Lunge", description: "Unilateral lower body exercise.", muscleGroup: "Legs, Glutes" },
    { id: dbLocalStorage.generateId(), name: "Plank", description: "Core stability exercise.", muscleGroup: "Core" },
    { id: dbLocalStorage.generateId(), name: "Bicep Curl", description: "Isolation exercise for biceps.", muscleGroup: "Biceps" },
    { id: dbLocalStorage.generateId(), name: "Tricep Extension", description: "Isolation exercise for triceps.", muscleGroup: "Triceps" },
    { id: dbLocalStorage.generateId(), name: "Leg Press", description: "Machine-based lower body exercise.", muscleGroup: "Legs, Glutes" },
    { id: dbLocalStorage.generateId(), name: "Lat Pulldown", description: "Machine-based upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { id: dbLocalStorage.generateId(), name: "Calf Raise", description: "Isolation exercise for calves.", muscleGroup: "Calves" },
    { id: dbLocalStorage.generateId(), name: "Russian Twist", description: "Core rotational exercise.", muscleGroup: "Core, Obliques" },
    { id: dbLocalStorage.generateId(), name: "Burpee", description: "Full body conditioning exercise.", muscleGroup: "Full Body" },
    { id: dbLocalStorage.generateId(), name: "Kettlebell Swing", description: "Full body explosive exercise.", muscleGroup: "Glutes, Hamstrings, Back, Core" },
    { id: dbLocalStorage.generateId(), name: "Dumbbell Shoulder Press", description: "Shoulder exercise with dumbbells.", muscleGroup: "Shoulders, Triceps" },
    { id: dbLocalStorage.generateId(), name: "Leg Curl", description: "Isolation exercise for hamstrings.", muscleGroup: "Hamstrings" },
    { id: dbLocalStorage.generateId(), name: "Leg Extension", description: "Isolation exercise for quadriceps.", muscleGroup: "Quadriceps" }
];

// --- State & Initial Data Loading (Local Storage for now, will transition to Firestore) ---
let clients = dbLocalStorage.read('clients');
let exercises = dbLocalStorage.read('exercises'); 

if (exercises.length === 0) {
    console.log("No exercises found in localStorage or data was corrupted/invalid. Loading default exercises.");
    exercises = DEFAULT_EXERCISES.map(ex => ({...ex, id: dbLocalStorage.generateId()}));
    dbLocalStorage.write('exercises', exercises);
    console.log("Default exercises loaded and written to localStorage:", exercises);
} else {
    console.log("Exercises successfully loaded from localStorage. Count:", exercises.length);
}

let workoutTemplates = dbLocalStorage.read('workoutTemplates');
let assignedWorkouts = dbLocalStorage.read('assignedWorkouts');
let currentTemplateExercises = [];

// --- Firebase User & Trainer Data ---
let currentFirebaseUser = null;
let currentTrainerData = null; // Stores trainer-specific data from Firestore users collection

// --- UI Elements (Declarations) ---
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
let clientPlanModalTitleElem, clientPlanModalContentElem;
let sidebarLogoElem, sidebarUserElem, sidebarAvatarElem, logoutBtn; // Added logoutBtn for admin

// --- MODAL HANDLING ---
function openModal(modalElement) { if (modalElement) modalElement.classList.add('is-active'); }
function closeModal(modalElement) { if (modalElement) modalElement.classList.remove('is-active'); }

// --- VIEW SWITCHING ---
function switchView(viewId) {
    if (!viewSections) return;
    viewSections.forEach(section => section.classList.toggle('is-active', section.id === viewId));
    if(navLinks) navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.view === viewId));
    window.location.hash = viewId.replace('View', '').toLowerCase();
}

// --- CLIENT MANAGEMENT FUNCTIONS (Currently Local Storage) ---
// These functions will be updated in subsequent steps to use Firestore
function renderClients() {
    if (!clientListContainer || !noClientsMessage) return;
    clientListContainer.innerHTML = '';
    noClientsMessage.style.display = clients.length === 0 ? 'block' : 'none';
    clients.forEach(client => {
        const clientItem = document.createElement('div'); clientItem.className = 'pt-client-list-item';
        const initials = client.name ? client.name.match(/\b(\w)/g)?.join('').substr(0,2).toUpperCase() || 'N/A' : 'N/A';
        clientItem.innerHTML = `<div class="pt-client-list-item__avatar">${initials}</div><div class="pt-client-list-item__info"><h4 class="pt-client-list-item__name">${client.name||'Unnamed'}</h4><p class="pt-client-list-item__meta text-small">${client.goal||'No goal'}</p></div><div class="pt-client-list-item__actions"><button class="pt-button pt-button--accent pt-button--small view-client-plan-btn" data-id="${client.id}">View Plan</button><button class="pt-button pt-button--secondary pt-button--small edit-client-btn" data-id="${client.id}">Edit</button><button class="pt-button pt-button--destructive pt-button--small delete-client-btn" data-id="${client.id}">Delete</button></div>`;
        clientListContainer.appendChild(clientItem);
    });
    updateDashboardStats(); populateAssignWorkoutSelects();
}
function handleClientFormSubmit(e) {
    e.preventDefault();
    const id=clientIdInput.value; const clientData={name:clientNameInput.value,email:clientEmailInput.value,phone:clientPhoneInput.value,dob:clientDobInput.value,goal:clientGoalInput.value,medicalNotes:clientMedicalNotesInput.value};
    if(id){clients=clients.map(c=>c.id===id?{...c,...clientData}:c);}else{clientData.id=dbLocalStorage.generateId();clients.push(clientData);} // Use dbLocalStorage
    dbLocalStorage.write('clients',clients);renderClients();closeModal(addEditClientModal);clientForm.reset();clientIdInput.value=''; // Use dbLocalStorage
}
function openClientModalForEdit(id) {
    const c=clients.find(cl=>cl.id===id); if(!c)return;
    clientModalTitle.textContent='Edit Client';clientIdInput.value=c.id;clientNameInput.value=c.name||'';clientEmailInput.value=c.email||'';clientPhoneInput.value=c.phone||'';clientDobInput.value=c.dob||'';clientGoalInput.value=c.goal||'';clientMedicalNotesInput.value=c.medicalNotes||'';
    openModal(addEditClientModal);
}
function handleDeleteClient(id) {
    const c=clients.find(cl=>cl.id===id); if(!c)return;
    confirmModalTitleElem.textContent='Delete Client';confirmModalMessageElem.textContent=`Delete ${c.name}?`;
    const newBtn=confirmModalConfirmBtnElem.cloneNode(true);confirmModalConfirmBtnElem.parentNode.replaceChild(newBtn,confirmModalConfirmBtnElem);confirmModalConfirmBtnElem=newBtn;
    confirmModalConfirmBtnElem.onclick=()=>{clients=clients.filter(cl=>cl.id!==id);dbLocalStorage.write('clients',clients);assignedWorkouts=assignedWorkouts.filter(aw=>aw.clientId!==id);dbLocalStorage.write('assignedWorkouts',assignedWorkouts);renderClients();renderAssignedWorkouts();closeModal(confirmModal);}; // Use dbLocalStorage
    openModal(confirmModal);
}

// --- EXERCISE MANAGEMENT FUNCTIONS (Currently Local Storage) ---
function renderExercises() {
    if(!exerciseListContainer||!noExercisesMessage||!templateExerciseSelect)return;
    exerciseListContainer.innerHTML='';templateExerciseSelect.innerHTML='<option value="">-- Select Exercise --</option>';
    noExercisesMessage.style.display=exercises.length===0?'block':'none';
    exercises.forEach(ex=>{
        const item=document.createElement('div');item.className='pt-accordion__item';
        item.innerHTML=`<button class="pt-accordion__button" aria-expanded="false" aria-controls="ex-acc-${ex.id}">${ex.name}</button><div class="pt-accordion__content" id="ex-acc-${ex.id}" hidden>${ex.muscleGroup?`<p><strong>Group:</strong> ${ex.muscleGroup}</p>`:''}${ex.description?`<p><strong>Desc:</strong> ${ex.description}</p>`:''}<div class="pt-client-list-item__actions" style="margin-top:var(--spacing-sm);"><button class="pt-button pt-button--secondary pt-button--small edit-exercise-btn" data-id="${ex.id}">Edit</button><button class="pt-button pt-button--destructive pt-button--small delete-exercise-btn" data-id="${ex.id}">Del</button></div></div>`;
        exerciseListContainer.appendChild(item);
        const opt=document.createElement('option');opt.value=ex.id;opt.textContent=ex.name;templateExerciseSelect.appendChild(opt);
    });
    initializeAccordions();updateDashboardStats();
}
function handleExerciseFormSubmit(e){
    e.preventDefault();
    const id=exerciseIdInput.value;const exData={name:exerciseNameInput.value,description:exerciseDescriptionInput.value,muscleGroup:exerciseMuscleGroupInput.value};
    if(id){exercises=exercises.map(ex=>ex.id===id?{...ex,...exData}:ex);}else{exData.id=dbLocalStorage.generateId();exercises.push(exData);} // Use dbLocalStorage
    dbLocalStorage.write('exercises',exercises);renderExercises();exerciseForm.reset();exerciseIdInput.value='';cancelEditExerciseBtn.style.display='none'; // Use dbLocalStorage
}
function openExerciseFormForEdit(id){
    const ex=exercises.find(e=>e.id===id);if(!ex)return;
    exerciseIdInput.value=ex.id;exerciseNameInput.value=ex.name;exerciseDescriptionInput.value=ex.description||'';exerciseMuscleGroupInput.value=ex.muscleGroup||'';
    cancelEditExerciseBtn.style.display='inline-block';exerciseNameInput.focus();
    if(exerciseForm)exerciseForm.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function handleDeleteExercise(id){
    const ex=exercises.find(e=>e.id===id);if(!ex)return;
    const used=workoutTemplates.some(t=>t.exercises.some(tei=>tei.exerciseId===id));
    let msg=`Delete "${ex.name}"?`;if(used)msg+=`\nWARNING: Used in templates.`;
    confirmModalTitleElem.textContent='Delete Exercise';confirmModalMessageElem.innerHTML=msg.replace(/\n/g,'<br>');
    const newBtn=confirmModalConfirmBtnElem.cloneNode(true);confirmModalConfirmBtnElem.parentNode.replaceChild(newBtn,confirmModalConfirmBtnElem);confirmModalConfirmBtnElem=newBtn;
    confirmModalConfirmBtnElem.onclick=()=>{exercises=exercises.filter(e=>e.id!==id);dbLocalStorage.write('exercises',exercises);workoutTemplates=workoutTemplates.map(t=>({...t,exercises:t.exercises.filter(tei=>tei.exerciseId!==id)}));dbLocalStorage.write('workoutTemplates',workoutTemplates);renderExercises();renderWorkoutTemplates();closeModal(confirmModal);}; // Use dbLocalStorage
    openModal(confirmModal);
}

// --- WORKOUT TEMPLATE MANAGEMENT FUNCTIONS (Currently Local Storage) ---
function renderWorkoutTemplates(){
    if(!workoutTemplateListContainer||!noWorkoutTemplatesMessage||!assignTemplateSelect)return;
    workoutTemplateListContainer.innerHTML='';assignTemplateSelect.innerHTML='<option value="">-- Select Template --</option>';
    noWorkoutTemplatesMessage.style.display=workoutTemplates.length===0?'block':'none';
    workoutTemplates.forEach(t=>{
        const item=document.createElement('div');item.className='pt-client-list-item';
        item.innerHTML=`<div class="pt-client-list-item__info"><h5 class="pt-client-list-item__name">${t.name}</h5><p class="pt-client-list-item__meta text-small">${t.exercises.length} ex.</p></div><div class="pt-client-list-item__actions"><button class="pt-button pt-button--secondary pt-button--small edit-template-btn" data-id="${t.id}">Edit</button><button class="pt-button pt-button--destructive pt-button--small delete-template-btn" data-id="${t.id}">Del</button></div>`;
        workoutTemplateListContainer.appendChild(item);
        const opt=document.createElement('option');opt.value=t.id;opt.textContent=t.name;assignTemplateSelect.appendChild(opt);
    });
    updateDashboardStats();
}
function renderSelectedExercisesForTemplate(){
    if(!selectedExercisesForTemplateContainer)return;
    selectedExercisesForTemplateContainer.innerHTML='';if(currentTemplateExercises.length===0){selectedExercisesForTemplateContainer.innerHTML='<p class="text-muted">No exercises added.</p>';return;}
    const list=document.createElement('ul');list.style.cssText='list-style:none;padding-left:0;';
    currentTemplateExercises.forEach((exD,idx)=>{
        const ex=exercises.find(e=>e.id===exD.exerciseId);if(!ex)return;
        const li=document.createElement('li');li.style.cssText='padding:var(--spacing-sm) 0;border-bottom:1px solid var(--border-color-light);';
        li.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-xs);"><strong>${ex.name}</strong><button type="button" class="pt-button pt-button--destructive pt-button--small remove-exercise-from-template-btn" data-index="${idx}">X</button></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:var(--spacing-sm);"><div class="pt-input-group"><label for="sets-${idx}" class="text-small">Sets:</label><input type="text" id="sets-${idx}" class="pt-input pt-input--small template-exercise-detail" data-index="${idx}" data-prop="sets" value="${exD.sets||''}"></div><div class="pt-input-group"><label for="reps-${idx}" class="text-small">Reps:</label><input type="text" id="reps-${idx}" class="pt-input pt-input--small template-exercise-detail" data-index="${idx}" data-prop="reps" value="${exD.reps||''}"></div><div class="pt-input-group"><label for="rest-${idx}" class="text-small">Rest(s):</label><input type="text" id="rest-${idx}" class="pt-input pt-input--small template-exercise-detail" data-index="${idx}" data-prop="rest" value="${exD.rest||''}"></div></div>`;
        list.appendChild(li);
    });
    selectedExercisesForTemplateContainer.appendChild(list);
}
function handleWorkoutTemplateFormSubmit(e){
    e.preventDefault();
    const id=workoutTemplateIdInput.value;const tData={name:templateNameInput.value,exercises:[...currentTemplateExercises]};
    if(tData.exercises.length===0){alert("Template needs exercises.");return;}
    if(id){workoutTemplates=workoutTemplates.map(wt=>wt.id===id?{...wt,...tData}:wt);}else{tData.id=dbLocalStorage.generateId();workoutTemplates.push(tData);} // Use dbLocalStorage
    dbLocalStorage.write('workoutTemplates',workoutTemplates);renderWorkoutTemplates();closeModal(createEditTemplateModal);workoutTemplateForm.reset();workoutTemplateIdInput.value='';currentTemplateExercises=[]; // Use dbLocalStorage
}
function openTemplateModalForEdit(id){
    const t=workoutTemplates.find(wt=>wt.id===id);if(!t)return;
    templateModalTitle.textContent='Edit Template';workoutTemplateIdInput.value=t.id;templateNameInput.value=t.name;currentTemplateExercises=JSON.parse(JSON.stringify(t.exercises));
    renderExercises();renderSelectedExercisesForTemplate();openModal(createEditTemplateModal);
}
function handleDeleteTemplate(id){
    const t=workoutTemplates.find(wt=>wt.id===id);if(!t)return;
    confirmModalTitleElem.textContent='Delete Template';confirmModalMessageElem.textContent=`Delete "${t.name}"? Also removes assignments.`;
    const newBtn=confirmModalConfirmBtnElem.cloneNode(true);confirmModalConfirmBtnElem.parentNode.replaceChild(newBtn,confirmModalConfirmBtnElem);confirmModalConfirmBtnElem=newBtn;
    confirmModalConfirmBtnElem.onclick=()=>{workoutTemplates=workoutTemplates.filter(wt=>wt.id!==id);dbLocalStorage.write('workoutTemplates',workoutTemplates);assignedWorkouts=assignedWorkouts.filter(aw=>aw.workoutTemplateId!==id);dbLocalStorage.write('assignedWorkouts',assignedWorkouts);renderWorkoutTemplates();renderAssignedWorkouts();closeModal(confirmModal);}; // Use dbLocalStorage
    openModal(confirmModal);
}

// --- ASSIGN WORKOUT MANAGEMENT FUNCTIONS (Currently Local Storage) ---
function populateAssignWorkoutSelects(){
    if(!assignClientSelect||!assignTemplateSelect)return;
    assignClientSelect.innerHTML='<option value="">-- Client --</option>';
    clients.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;assignClientSelect.appendChild(o);});
}
function renderAssignedWorkouts(){
    if(!assignedWorkoutsLogContainer)return;
    assignedWorkoutsLogContainer.innerHTML='';if(assignedWorkouts.length===0){assignedWorkoutsLogContainer.innerHTML='<p class="text-muted">No assignments yet.</p>';return;}
    const list=document.createElement('ul');list.style.cssText='list-style:none;padding-left:0;';
    assignedWorkouts.slice().reverse().forEach(aw=>{
        const c=clients.find(cl=>cl.id===aw.clientId);const t=workoutTemplates.find(wt=>wt.id===aw.workoutTemplateId);if(!c||!t)return;
        const li=document.createElement('li');li.className='pt-client-list-item';
        li.innerHTML=`<div class="pt-client-list-item__info"><h5 class="pt-client-list-item__name">${c.name} - ${t.name}</h5><p class="pt-client-list-item__meta text-small">For: ${new Date(aw.dateAssigned).toLocaleDateString()} (Status: ${aw.status})</p></div><div class="pt-client-list-item__actions"><button class="pt-button pt-button--destructive pt-button--small delete-assignment-btn" data-id="${aw.id}">Remove</button></div>`;
        list.appendChild(li);
    });
    assignedWorkoutsLogContainer.appendChild(list);
}
function handleAssignWorkoutFormSubmit(e){
    e.preventDefault();
    if(!assignClientSelect.value||!assignTemplateSelect.value||!assignDateInput.value){alert("All fields required.");return;}
    const ass={id:dbLocalStorage.generateId(),clientId:assignClientSelect.value,workoutTemplateId:assignTemplateSelect.value,dateAssigned:assignDateInput.value,status:'pending'}; // Use dbLocalStorage
    assignedWorkouts.push(ass);dbLocalStorage.write('assignedWorkouts',assignedWorkouts);renderAssignedWorkouts();assignWorkoutForm.reset(); // Use dbLocalStorage
}
function handleDeleteAssignment(id){
    if(!confirm("Remove assignment?"))return;
    assignedWorkouts=assignedWorkouts.filter(aw=>aw.id!==id);dbLocalStorage.write('assignedWorkouts',assignedWorkouts);renderAssignedWorkouts(); // Use dbLocalStorage
}

// --- VIEW CLIENT'S PLAN (Currently Local Storage) ---
function openViewClientPlanModal(clientId) {
    const client=clients.find(c=>c.id===clientId);if(!client)return;
    if(!viewClientPlanModal||!clientPlanModalTitleElem||!clientPlanModalContentElem)return;
    clientPlanModalTitleElem.textContent=`${client.name}'s Plan`;clientPlanModalContentElem.innerHTML='<p class="text-muted">Loading...</p>';
    const clientAssigns=assignedWorkouts.filter(aw=>aw.clientId===clientId).sort((a,b)=>new Date(a.dateAssigned)-new Date(b.dateAssigned));
    if(clientAssigns.length===0){clientPlanModalContentElem.innerHTML='<p class="text-muted">No workouts assigned.</p>';openModal(viewClientPlanModal);return;}
    let html='';
    clientAssigns.forEach(aw=>{
        const template=workoutTemplates.find(wt=>wt.id===aw.workoutTemplateId);
        if(template){
            html+=`<div class="pt-card" style="margin-bottom:var(--spacing-md);"><h4 class="pt-card-title">${template.name} - Assigned: ${new Date(aw.dateAssigned).toLocaleDateString()}</h4><ul style="list-style:none;padding-left:0;">`;
            template.exercises.forEach(exD=>{
                const exInfo=exercises.find(ex=>ex.id===exD.exerciseId);
                if(exInfo)html+=`<li style="padding:var(--spacing-xs) 0;border-bottom:1px dashed var(--border-color-light);"><strong>${exInfo.name}</strong>: ${exD.sets||'N/A'} sets, ${exD.reps||'N/A'} reps, ${exD.rest||'N/A'}s rest</li>`;
            });
            html+=`</ul></div>`;
        }
    });
    clientPlanModalContentElem.innerHTML=html||'<p class="text-muted">No details.</p>';openModal(viewClientPlanModal);
}

// --- DASHBOARD STATS ---
function updateDashboardStats(){if(totalClientsStat)totalClientsStat.textContent=clients.length;if(totalWorkoutTemplatesStat)totalWorkoutTemplatesStat.textContent=workoutTemplates.length;}

// --- INITIALIZE APP FUNCTION (called AFTER auth check) ---
async function initializeApp() { // Made async as we might do Firestore reads here later

    // Ensure we have user and trainer data before proceeding with UI
    if (!currentFirebaseUser || !currentTrainerData) {
        console.error("initializeApp: Firebase user or trainer data not available. Aborting UI setup.");
        return;
    }

    // --- UI Element Initialization ---
    bodyElement = document.body;
    viewSections = document.querySelectorAll('.view-section'); navLinks = document.querySelectorAll('.pt-sidebar__nav-link');
    mvpThemeSwitcherElement = document.getElementById('mvpThemeSwitcher');
    addEditClientModal = document.getElementById('addEditClientModal'); confirmModal = document.getElementById('confirmModal');
    createEditTemplateModal = document.getElementById('createEditTemplateModal'); viewClientPlanModal = document.getElementById('viewClientPlanModal');
    clientListContainer = document.getElementById('clientListContainer'); noClientsMessage = document.getElementById('noClientsMessage');
    clientModalTitle = document.getElementById('clientModalTitle'); clientForm = document.getElementById('clientForm');
    openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
    clientIdInput = document.getElementById('clientId'); clientNameInput = document.getElementById('clientName'); clientEmailInput = document.getElementById('clientEmail'); clientPhoneInput = document.getElementById('clientPhone'); clientDobInput = document.getElementById('clientDob'); clientGoalInput = document.getElementById('clientGoal'); clientMedicalNotesInput = document.getElementById('clientMedicalNotes');
    exerciseForm = document.getElementById('exerciseForm'); exerciseIdInput = document.getElementById('exerciseId'); exerciseNameInput = document.getElementById('exerciseName'); exerciseDescriptionInput = document.getElementById('exerciseDescription'); exerciseMuscleGroupInput = document.getElementById('exerciseMuscleGroup');
    exerciseListContainer = document.getElementById('exerciseListContainer'); noExercisesMessage = document.getElementById('noExercisesMessage'); cancelEditExerciseBtn = document.getElementById('cancelEditExerciseBtn');
    openCreateTemplateModalBtn = document.getElementById('openCreateTemplateModalBtn'); templateModalTitle = document.getElementById('templateModalTitle'); workoutTemplateForm = document.getElementById('workoutTemplateForm'); workoutTemplateIdInput = document.getElementById('workoutTemplateId'); templateNameInput = document.getElementById('templateName');
    templateExerciseSelect = document.getElementById('templateExerciseSelect'); addExerciseToTemplateBtn = document.getElementById('addExerciseToTemplateBtn'); selectedExercisesForTemplateContainer = document.getElementById('selectedExercisesForTemplateContainer');
    workoutTemplateListContainer = document.getElementById('workoutTemplateListContainer'); noWorkoutTemplatesMessage = document.getElementById('noWorkoutTemplatesMessage');
    assignWorkoutForm = document.getElementById('assignWorkoutForm'); assignClientSelect = document.getElementById('assignClientSelect'); assignTemplateSelect = document.getElementById('assignTemplateSelect'); assignDateInput = document.getElementById('assignDate');
    assignedWorkoutsLogContainer = document.getElementById('assignedWorkoutsLogContainer');
    totalClientsStat = document.getElementById('totalClientsStat'); totalWorkoutTemplatesStat = document.getElementById('totalWorkoutTemplatesStat');
    confirmModalTitleElem = document.getElementById('confirmModalTitle'); confirmModalMessageElem = document.getElementById('confirmModalMessage'); confirmModalConfirmBtnElem = document.getElementById('confirmModalConfirmBtn'); confirmModalCancelBtnElem = document.getElementById('confirmModalCancelBtn');
    clientPlanModalTitleElem = document.getElementById('clientPlanModalTitle'); clientPlanModalContentElem = document.getElementById('clientPlanModalContent');
    sidebarLogoElem = document.querySelector('.pt-sidebar__logo'); sidebarUserElem = document.querySelector('.pt-sidebar__user-name'); sidebarAvatarElem = document.querySelector('.pt-sidebar__user-avatar');
    logoutBtn = document.getElementById('logoutBtn'); // Ensure this element is retrieved

    // --- Update sidebar with logged-in trainer's info ---
    if (sidebarUserElem && currentTrainerData) {
        sidebarUserElem.textContent = currentTrainerData.displayName || currentFirebaseUser.displayName || "Trainer";
    }
    if (sidebarAvatarElem && currentTrainerData) {
        const name = currentTrainerData.displayName || currentFirebaseUser.displayName || "T";
        const initials = name.match(/\b(\w)/g)?.join('').substr(0,2).toUpperCase() || name.charAt(0).toUpperCase();
        sidebarAvatarElem.textContent = initials;
    }
    // Add logout functionality to sidebar if it exists
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log("Trainer signed out from admin app.");
                // onAuthStateChanged will handle redirection
            } catch (error) {
                console.error("Error signing out from admin app:", error);
                alert("Error signing out. Please try again.");
            }
        });
    }


    // --- Theme Switcher Initialization ---
    if (mvpThemeSwitcherElement && bodyElement) {
        initializeThemeSwitcher(
            FITFLOW_THEMES_CONFIG,
            mvpThemeSwitcherElement, 
            document.body, // Apply to body for global effect
            (newThemeValue, currentThemeObject) => {
                // Apply theme to modals
                const modalsToTheme = [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal];
                modalsToTheme.forEach(modal => {
                    if (modal) {
                        FITFLOW_THEMES_CONFIG.forEach(t => { if (modal.classList.contains(t.value)) { modal.classList.remove(t.value); }});
                        modal.classList.add(newThemeValue);
                    }
                });
                // Update sidebar logo if theme object has it (user name/avatar from Firebase)
                if (currentThemeObject && sidebarLogoElem && currentThemeObject.sidebarLogo) {
                    sidebarLogoElem.textContent = currentThemeObject.sidebarLogo;
                }
            },
            'fitflowGlobalTheme' // Use global key
        );
    } else if (FITFLOW_THEMES_CONFIG.length > 0 && bodyElement) { // Fallback if switcher element not found
        const defaultTheme = FITFLOW_THEMES_CONFIG.find(t => document.body.classList.contains(t.value)) || FITFLOW_THEMES_CONFIG[0];
        if (!document.body.className.includes('theme-')) { // Apply default if no theme class exists
            bodyElement.classList.add(defaultTheme.value);
        }
        bodyElement.style.backgroundColor = 'var(--background-color)'; bodyElement.style.color = 'var(--text-color)';
        // Set default sidebar logo if theme object has it
        if (defaultTheme && sidebarLogoElem && defaultTheme.sidebarLogo) sidebarLogoElem.textContent = defaultTheme.sidebarLogo;
        // Theme modals with default theme
        [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal].forEach(m => { if(m) { FITFLOW_THEMES_CONFIG.forEach(t => m.classList.remove(t.value)); m.classList.add(defaultTheme.value); } });
    }

    // --- Modal Event Listeners (Generic) ---
    [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal].forEach(modal => {
        if(modal){modal.querySelectorAll('.pt-modal__close').forEach(btn => btn.addEventListener('click', () => closeModal(modal)));modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });}
    });
    if(confirmModalCancelBtnElem) confirmModalCancelBtnElem.addEventListener('click', () => closeModal(confirmModal));
    
    // --- Navigation ---
    if(navLinks) navLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); switchView(link.dataset.view); }));
    
    // --- Client Management Listeners ---
    if(openAddClientModalBtn) openAddClientModalBtn.addEventListener('click', () => { clientModalTitle.textContent='Add Client';clientForm.reset();clientIdInput.value='';openModal(addEditClientModal);});
    if(clientForm) clientForm.addEventListener('submit', handleClientFormSubmit);
    if(clientListContainer) clientListContainer.addEventListener('click', (e) => { if (e.target.classList.contains('edit-client-btn')) openClientModalForEdit(e.target.dataset.id); else if (e.target.classList.contains('delete-client-btn')) handleDeleteClient(e.target.dataset.id); else if (e.target.classList.contains('view-client-plan-btn')) openViewClientPlanModal(e.target.dataset.id); });
    
    // --- Exercise Management Listeners ---
    if(exerciseForm) exerciseForm.addEventListener('submit', handleExerciseFormSubmit);
    if(cancelEditExerciseBtn) cancelEditExerciseBtn.addEventListener('click', () => { exerciseForm.reset();exerciseIdInput.value='';cancelEditExerciseBtn.style.display='none';});
    if(exerciseListContainer) exerciseListContainer.addEventListener('click', (e) => { const eb=e.target.closest('.edit-exercise-btn');const db=e.target.closest('.delete-exercise-btn');if(eb){e.stopPropagation();openExerciseFormForEdit(eb.dataset.id);}else if(db){e.stopPropagation();handleDeleteExercise(db.dataset.id);}});
    
    // --- Workout Template Management Listeners ---
    if(openCreateTemplateModalBtn) openCreateTemplateModalBtn.addEventListener('click', () => { templateModalTitle.textContent='Create Template';workoutTemplateForm.reset();workoutTemplateIdInput.value='';currentTemplateExercises=[];renderExercises();renderSelectedExercisesForTemplate();openModal(createEditTemplateModal);});
    if(workoutTemplateForm) workoutTemplateForm.addEventListener('submit', handleWorkoutTemplateFormSubmit);
    if(addExerciseToTemplateBtn) addExerciseToTemplateBtn.addEventListener('click', () => { const exId=templateExerciseSelect.value;if(exId){if(!currentTemplateExercises.find(ex=>ex.exerciseId===exId)){currentTemplateExercises.push({exerciseId:exId,sets:'',reps:'',rest:''});renderSelectedExercisesForTemplate();}else{alert("Already in template.");}}templateExerciseSelect.value="";});
    if(selectedExercisesForTemplateContainer){selectedExercisesForTemplateContainer.addEventListener('click',(e)=>{if(e.target.classList.contains('remove-exercise-from-template-btn')){const idx=parseInt(e.target.dataset.index);if(!isNaN(idx)&&idx>=0&&idx<currentTemplateExercises.length){currentTemplateExercises.splice(idx,1);renderSelectedExercisesForTemplate();}}});selectedExercisesForTemplateContainer.addEventListener('input',(e)=>{if(e.target.classList.contains('template-exercise-detail')){const idx=parseInt(e.target.dataset.index);const prop=e.target.dataset.prop;if(currentTemplateExercises[idx]&&prop)currentTemplateExercises[idx][prop]=e.target.value;}});}
    if(workoutTemplateListContainer) workoutTemplateListContainer.addEventListener('click', (e) => { if (e.target.classList.contains('edit-template-btn')) openTemplateModalForEdit(e.target.dataset.id); else if (e.target.classList.contains('delete-template-btn')) handleDeleteTemplate(e.target.dataset.id); });
    
    // --- Assign Workout Management Listeners ---
    if(assignWorkoutForm) assignWorkoutForm.addEventListener('submit', handleAssignWorkoutFormSubmit);
    if(assignedWorkoutsLogContainer) assignedWorkoutsLogContainer.addEventListener('click', (e) => { if (e.target.classList.contains('delete-assignment-btn')) handleDeleteAssignment(e.target.dataset.id); });

    // --- Initial Renders (now called after auth/role check) ---
    renderClients(); 
    renderExercises(); 
    renderWorkoutTemplates(); 
    renderAssignedWorkouts(); 
    const initialViewId = window.location.hash ? window.location.hash.substring(1).toLowerCase() + 'View' : 'dashboardView';
    switchView(document.getElementById(initialViewId) ? initialViewId : 'dashboardView');
    console.log("MVP Admin App Initialized (Firebase Auth & Role Check).");
}

// --- AUTH STATE CHECK & APP BOOTSTRAP ---
// This listener runs as soon as Firebase Auth loads.
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentFirebaseUser = user;
        // Verify user role from Firestore
        const userDocRef = doc(db, "users", user.uid);
        try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().role === "trainer") {
                currentTrainerData = userDocSnap.data();
                console.log("Admin App: Trainer authenticated and authorized:", currentTrainerData.displayName || user.displayName);
                // Initialize the app only after DOM is ready AND user is confirmed as trainer
                // This ensures all UI elements are available when initializeApp runs
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initializeApp);
                } else {
                    initializeApp();
                }
            } else {
                // User is signed in via Firebase, but not a 'trainer' role in Firestore
                console.warn("Admin App: User is not authorized as a trainer or profile missing. Redirecting.", userDocSnap.exists() ? userDocSnap.data() : "No user profile found in Firestore.");
                await signOut(auth); // Sign out the unauthorized user from Firebase Auth
                window.location.href = 'index.html?error=not_trainer'; // Redirect with an error flag
            }
        } catch (error) {
            console.error("Admin App: Error fetching user role from Firestore. Redirecting.", error);
            await signOut(auth); // Sign out on error
            window.location.href = 'index.html?error=auth_check_failed';
        }
    } else {
        // No user signed in (or signed out). Redirect to landing page.
        console.log("Admin App: No user signed in. Redirecting to login.");
        window.location.href = 'index.html';
    }
});
