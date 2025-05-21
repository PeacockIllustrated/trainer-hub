// assets/js/mvp-app.js
import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeAccordions } from './components/accordion.js';
import { FITFLOW_THEMES_CONFIG } from './themes-config.js';
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// NEW: Import Firestore functions for clients
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// --- Local Storage Database Helper (TEMPORARY - will be phased out for Firestore) ---
// ... (dbLocalStorage as it is, as exercises, templates, assigned workouts are still Local Storage)
const DB_PREFIX = 'fitflow_mvp_';
const dbLocalStorage = { /* ... (your existing code for dbLocalStorage) ... */
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
// ... (DEFAULT_EXERCISES as it is) ...

// --- State & Initial Data Loading ---
// clients will now come from Firestore, so remove this Local Storage read
let clients = []; // Initialize as empty, will be populated by Firestore listener
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
let currentTrainerData = null;

// --- UI Elements (Declarations) ---
// ... (All UI elements declared as before) ...

// --- MODAL HANDLING (as before) ---
// ...

// --- VIEW SWITCHING (as before) ---
// ...

// --- CLIENT MANAGEMENT FUNCTIONS (NOW Firestore-aware) ---
// These functions are updated to interact with Firestore for clients
// rather than dbLocalStorage directly for client-related data.

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
async function handleClientFormSubmit(e) {
    e.preventDefault();
    if (!currentFirebaseUser) { console.error("No trainer logged in to add client."); return; } // Safety check

    const id = clientIdInput.value;
    const clientData = {
        name: clientNameInput.value, email: clientEmailInput.value, phone: clientPhoneInput.value,
        dob: clientDobInput.value, goal: clientGoalInput.value, medicalNotes: clientMedicalNotesInput.value,
        trainerId: currentFirebaseUser.uid, // IMPORTANT: Link client to trainer
        createdAt: serverTimestamp() // Add timestamp for when client was created
    };

    try {
        if (id) {
            // Editing existing client
            const clientDocRef = doc(db, "clients", id);
            await updateDoc(clientDocRef, clientData);
            console.log("Client updated in Firestore:", id);
        } else {
            // Adding new client
            const clientsCollectionRef = collection(db, "clients");
            const newClientRef = await addDoc(clientsCollectionRef, clientData);
            console.log("New client added to Firestore with ID:", newClientRef.id);
        }
        closeModal(addEditClientModal);
        clientForm.reset();
        clientIdInput.value = '';
        // UI will update automatically via onSnapshot listener, no need to call renderClients() manually here.
    } catch (error) {
        console.error("Error saving client to Firestore:", error);
        alert("Failed to save client. Please try again.");
    }
}
async function openClientModalForEdit(id) {
    const c = clients.find(cl=>cl.id===id); // clients array is kept in sync by onSnapshot
    if (!c) { console.error(`Client with ID ${id} not found in local array.`); return; }
    
    // Populate form fields
    clientModalTitle.textContent='Edit Client';clientIdInput.value=c.id;clientNameInput.value=c.name||'';clientEmailInput.value=c.email||'';clientPhoneInput.value=c.phone||'';clientDobInput.value=c.dob||'';clientGoalInput.value=c.goal||'';clientMedicalNotesInput.value=c.medicalNotes||'';
    openModal(addEditClientModal);
}
async function handleDeleteClient(id) {
    const c = clients.find(cl=>cl.id===id);
    if (!c) { console.error(`Client with ID ${id} not found.`); return; }
    
    confirmModalTitleElem.textContent='Delete Client';confirmModalMessageElem.textContent=`Are you sure you want to delete ${c.name}? This action cannot be undone. It will also delete any workouts assigned to them.`;
    const newConfirmBtn = confirmModalConfirmBtnElem.cloneNode(true);
    confirmModalConfirmBtnElem.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtnElem);
    confirmModalConfirmBtnElem = newConfirmBtn; 

    confirmModalConfirmBtnElem.onclick = async () => {
        try {
            // Delete client document from Firestore
            const clientDocRef = doc(db, "clients", id);
            await deleteDoc(clientDocRef);
            console.log("Client deleted from Firestore:", id);

            // TODO: In a real app, you'd also delete associated assigned workouts from Firestore
            // For now, let's just delete from Local Storage for consistency with other temporary data
            assignedWorkouts = assignedWorkouts.filter(aw => aw.clientId !== id);
            dbLocalStorage.write('assignedWorkouts', assignedWorkouts);
            renderAssignedWorkouts(); // Re-render assigned workouts
            
            // UI will update automatically via onSnapshot listener for clients
            closeModal(confirmModal);
        } catch (error) {
            console.error("Error deleting client from Firestore:", error);
            alert("Failed to delete client. Please try again.");
        }
    };
    openModal(confirmModal);
}

// --- Firestore Subscription for Clients ---
let unsubscribeClients = () => {}; // Placeholder for the unsubscribe function

function subscribeToClients() {
    if (!currentFirebaseUser) {
        console.warn("subscribeToClients: No authenticated user. Cannot subscribe.");
        return;
    }
    const clientsCollectionRef = collection(db, "clients");
    const q = query(clientsCollectionRef, where("trainerId", "==", currentFirebaseUser.uid));

    // Set up real-time listener
    unsubscribeClients = onSnapshot(q, (snapshot) => {
        const clientsFromFirestore = [];
        snapshot.forEach((doc) => {
            clientsFromFirestore.push({ id: doc.id, ...doc.data() });
        });
        clients = clientsFromFirestore; // Update local clients array
        console.log("Clients updated from Firestore:", clients.length, clients);
        renderClients(); // Re-render clients whenever data changes in Firestore
    }, (error) => {
        console.error("Error subscribing to clients:", error);
        alert("Failed to load clients. Please check your internet connection and try again.");
    });
}

// --- EXERCISE MANAGEMENT FUNCTIONS (Still Local Storage) ---
// ... (Your existing renderExercises, handleExerciseFormSubmit, openExerciseFormForEdit, handleDeleteExercise) ...
// Ensure you are using dbLocalStorage.write() and dbLocalStorage.generateId() here.

// --- WORKOUT TEMPLATE MANAGEMENT FUNCTIONS (Still Local Storage) ---
// ... (Your existing renderWorkoutTemplates, renderSelectedExercisesForTemplate, handleWorkoutTemplateFormSubmit, openTemplateModalForEdit, handleDeleteTemplate) ...
// Ensure you are using dbLocalStorage.write() and dbLocalStorage.generateId() here.

// --- ASSIGN WORKOUT MANAGEMENT FUNCTIONS (Still Local Storage) ---
// ... (Your existing populateAssignWorkoutSelects, renderAssignedWorkouts, handleAssignWorkoutFormSubmit, handleDeleteAssignment) ...
// Ensure you are using dbLocalStorage.write() and dbLocalStorage.generateId() here.

// --- VIEW CLIENT'S PLAN (Still Local Storage) ---
// ... (Your existing openViewClientPlanModal) ...

// --- DASHBOARD STATS (still Local Storage) ---
// ... (Your existing updateDashboardStats) ...

// --- INITIALIZE APP FUNCTION (called AFTER auth check) ---
async function initializeApp() {
    if (!currentFirebaseUser || !currentTrainerData) {
        console.error("initializeApp: Firebase user or trainer data not available. Aborting UI setup.");
        return;
    }

    // --- UI Element Initialization ---
    // ... (All UI elements retrieved via getElementById as before) ...
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
    logoutBtn = document.querySelector('.pt-sidebar__logout-link'); // Correctly select the logout link if it's there


    // --- Update sidebar with logged-in trainer's info ---
    if (sidebarUserElem && currentTrainerData) {
        sidebarUserElem.textContent = currentTrainerData.displayName || currentFirebaseUser.displayName || "Trainer";
    }
    if (sidebarAvatarElem && currentTrainerData) {
        const name = currentTrainerData.displayName || currentFirebaseUser.displayName || "T";
        const initials = name.match(/\b(\w)/g)?.join('').substr(0,2).toUpperCase() || name.charAt(0).toUpperCase();
        sidebarAvatarElem.textContent = initials;
    }
    // Add logout functionality to sidebar
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => { // Added 'e' parameter
            e.preventDefault(); // Prevent default link behavior
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
    // ... (theme switcher initialization as before, it will use FITFLOW_THEMES_CONFIG and fitflowGlobalTheme) ...
    const GLOBAL_THEME_KEY = 'fitflowGlobalTheme'; // Define the global theme key locally
    if (mvpThemeSwitcherElement && bodyElement) {
        initializeThemeSwitcher(
            FITFLOW_THEMES_CONFIG,
            mvpThemeSwitcherElement, 
            document.body,
            (newThemeValue, currentThemeObject) => {
                const modalsToTheme = [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal];
                modalsToTheme.forEach(modal => {
                    if (modal) {
                        FITFLOW_THEMES_CONFIG.forEach(t => { if (modal.classList.contains(t.value)) { modal.classList.remove(t.value); }});
                        modal.classList.add(newThemeValue);
                    }
                });
                if (currentThemeObject && sidebarLogoElem && currentThemeObject.sidebarLogo) {
                    sidebarLogoElem.textContent = currentThemeObject.sidebarLogo;
                }
            },
            GLOBAL_THEME_KEY // Use global key
        );
    } else if (FITFLOW_THEMES_CONFIG.length > 0 && bodyElement) {
        const defaultTheme = FITFLOW_THEMES_CONFIG.find(t => document.body.classList.contains(t.value)) || FITFLOW_THEMES_CONFIG[0];
        if (!document.body.className.includes('theme-')) {
            bodyElement.classList.add(defaultTheme.value);
        }
        bodyElement.style.backgroundColor = 'var(--background-color)'; bodyElement.style.color = 'var(--text-color)';
        if (sidebarLogoElem && defaultTheme.sidebarLogo) sidebarLogoElem.textContent = defaultTheme.sidebarLogo;
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
    if(clientForm) clientForm.addEventListener('submit', handleClientFormSubmit); // Now async
    if(clientListContainer) clientListContainer.addEventListener('click', (e) => { 
        if (e.target.classList.contains('edit-client-btn')) openClientModalForEdit(e.target.dataset.id); 
        else if (e.target.classList.contains('delete-client-btn')) handleDeleteClient(e.target.dataset.id); // Now async
        else if (e.target.classList.contains('view-client-plan-btn')) openViewClientPlanModal(e.target.dataset.id); 
    });
    
    // --- Exercise Management Listeners ---
    if(exerciseForm) exerciseForm.addEventListener('submit', handleExerciseFormSubmit); // Still Local Storage
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

    // Initial data load and renders are now handled by subscribeToClients
    // and other Local Storage reads at the top.
    // The initial view is set here.
    const initialViewId = window.location.hash ? window.location.hash.substring(1).toLowerCase() + 'View' : 'dashboardView';
    switchView(document.getElementById(initialViewId) ? initialViewId : 'dashboardView');
    console.log("MVP Admin App UI Initialized.");
}

// --- AUTH STATE CHECK & APP BOOTSTRAP ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentFirebaseUser = user;
        const userDocRef = doc(db, "users", user.uid);
        try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().role === "trainer") {
                currentTrainerData = userDocSnap.data();
                console.log("Admin App: Trainer authenticated and authorized:", currentTrainerData.displayName || user.displayName);
                
                // Initialize UI elements and set up event listeners
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initializeApp);
                } else {
                    initializeApp();
                }

                // AFTER UI is initialized, subscribe to client data changes
                subscribeToClients(); // Start real-time sync for clients

                // Load other Local Storage data (exercises, templates, assigned workouts)
                // These will remain Local Storage for now, until we migrate them to Firestore
                exercises = dbLocalStorage.read('exercises');
                workoutTemplates = dbLocalStorage.read('workoutTemplates');
                assignedWorkouts = dbLocalStorage.read('assignedWorkouts');

                // Initial renders that depend on Local Storage data
                renderExercises(); 
                renderWorkoutTemplates(); 
                renderAssignedWorkouts(); 

            } else {
                console.warn("Admin App: User is not authorized as a trainer or profile missing. Redirecting.", userDocSnap.exists() ? userDocSnap.data() : "No user profile found in Firestore.");
                await signOut(auth);
                window.location.href = 'index.html?error=not_trainer';
            }
        } catch (error) {
            console.error("Admin App: Error fetching user role from Firestore. Redirecting.", error);
            await signOut(auth);
            window.location.href = 'index.html?error=auth_check_failed';
        }
    } else {
        console.log("Admin App: No user signed in. Redirecting to login.");
        window.location.href = 'index.html';
    }
});
