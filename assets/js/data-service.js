// assets/js/data-service.js
/**
 * This service provides a centralized API for all Firestore database operations,
 * abstracting the backend logic from the main application files.
 * It handles all CRUD operations for the application's data models, ensuring
 * that all data is correctly scoped to the authenticated trainer.
 */

import { db } from './firebase-config.js';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Helper Functions ---
const getCollectionRef = (collectionName) => collection(db, collectionName);

/**
 * Fetches all documents from a specific collection that belong to a given trainer.
 * @param {string} collectionName - The name of the collection to query.
 * @param {string} trainerId - The UID of the authenticated trainer.
 * @returns {Promise<Array>} A promise that resolves to an array of documents, each with its ID.
 */
async function getDocsByTrainer(collectionName, trainerId) {
    if (!trainerId) {
        console.error(`getDocsByTrainer: trainerId is required to fetch from ${collectionName}.`);
        return [];
    }
    try {
        const q = query(getCollectionRef(collectionName), where("trainerId", "==", trainerId));
        const querySnapshot = await getDocs(q);
        const docs = [];
        querySnapshot.forEach((doc) => {
            docs.push({ id: doc.id, ...doc.data() });
        });
        return docs;
    } catch (error) {
        console.error(`Error fetching ${collectionName} for trainer ${trainerId}:`, error);
        throw error; // Re-throw to be handled by the caller
    }
}

/**
 * Adds a new document to a collection with trainerId and timestamps.
 * @param {string} collectionName - The name of the collection.
 * @param {object} data - The document data to add.
 * @param {string} trainerId - The UID of the authenticated trainer.
 * @returns {Promise<import("firebase/firestore").DocumentReference>} A promise that resolves to the new document reference.
 */
async function addDocument(collectionName, data, trainerId) {
    if (!trainerId) {
        throw new Error("A trainer ID is required to add a document.");
    }
    const docWithMeta = {
        ...data,
        trainerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    return await addDoc(getCollectionRef(collectionName), docWithMeta);
}

/**
 * Updates an existing document in a collection.
 * @param {string} collectionName - The name of the collection.
 * @param {string} docId - The ID of the document to update.
 * @param {object} data - The data to update.
 * @returns {Promise<void>}
 */
async function updateDocument(collectionName, docId, data) {
    const docRef = doc(db, collectionName, docId);
    const dataToUpdate = {
        ...data,
        updatedAt: serverTimestamp()
    };
    return await updateDoc(docRef, dataToUpdate);
}

/**
 * Deletes a document from a collection.
 * @param {string} collectionName - The name of the collection.
 * @param {string} docId - The ID of the document to delete.
 * @returns {Promise<void>}
 */
async function deleteDocument(collectionName, docId) {
    const docRef = doc(db, collectionName, docId);
    return await deleteDoc(docRef);
}


// --- Public API for Data Service ---

export const dataService = {
    // --- Client Management ---
    getClients: (trainerId) => getDocsByTrainer('clients', trainerId),
    addClient: (clientData, trainerId) => addDocument('clients', clientData, trainerId),
    updateClient: (clientId, clientData) => updateDocument('clients', clientId, clientData),
    deleteClient: async (clientId) => {
        const batch = writeBatch(db);
        const assignedWorkoutsRef = getCollectionRef('assignedWorkouts');
        const q = query(assignedWorkoutsRef, where("clientId", "==", clientId));
        const assignedWorkoutsSnapshot = await getDocs(q);
        assignedWorkoutsSnapshot.forEach(doc => batch.delete(doc.ref));
        const clientRef = doc(db, 'clients', clientId);
        batch.delete(clientRef);
        await batch.commit();
    },
    getClientByEmail: async (email) => {
        const q = query(getCollectionRef('clients'), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        // Assuming one client per email for a given trainer context, return the first.
        const clientDoc = querySnapshot.docs[0];
        return { id: clientDoc.id, ...clientDoc.data() };
    },

    // --- Exercise Management ---
    getExercises: (trainerId) => getDocsByTrainer('exercises', trainerId),
    addExercise: (exerciseData, trainerId) => addDocument('exercises', exerciseData, trainerId),
    updateExercise: (exerciseId, exerciseData) => updateDocument('exercises', exerciseId, exerciseData),
    deleteExercise: (exerciseId) => deleteDocument('exercises', exerciseId), // Note: We might need to handle cleanup in templates later

    // --- Workout Template Management ---
    getWorkoutTemplates: (trainerId) => getDocsByTrainer('workoutTemplates', trainerId),
    addWorkoutTemplate: (templateData, trainerId) => addDocument('workoutTemplates', templateData, trainerId),
    updateWorkoutTemplate: (templateId, templateData) => updateDocument('workoutTemplates', templateId, templateData),
    deleteWorkoutTemplate: (templateId) => deleteDocument('workoutTemplates', templateId), // Note: We might need to handle cleanup in assignments later

    // --- Assigned Workout Management ---
    getAssignedWorkouts: (trainerId) => getDocsByTrainer('assignedWorkouts', trainerId),
    getAssignedWorkoutsForClient: async (clientId) => {
        // This is a special case for the client app.
        // It queries for workouts assigned to a specific client ID.
        if (!clientId) {
            console.error("getAssignedWorkoutsForClient: A client ID is required.");
            return [];
        }
        try {
            const q = query(getCollectionRef('assignedWorkouts'), where("clientId", "==", clientId));
            const querySnapshot = await getDocs(q);
            const workouts = [];
            querySnapshot.forEach((doc) => {
                workouts.push({ id: doc.id, ...doc.data() });
            });
            return workouts;
        } catch (error) {
            console.error(`Error fetching workouts for client ${clientId}:`, error);
            throw error;
        }
    },
    assignWorkout: (assignmentData, trainerId) => addDocument('assignedWorkouts', assignmentData, trainerId),
    updateAssignment: (assignmentId, assignmentData) => updateDocument('assignedWorkouts', assignmentId, assignmentData),
    deleteAssignment: (assignmentId) => deleteDocument('assignedWorkouts', assignmentId),

    // --- Workout Progress Tracking (for Client App) ---
    getWorkoutProgress: async (assignmentId) => {
        try {
            const docRef = doc(db, 'workoutProgress', assignmentId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data().progress : null;
        } catch (error) {
            console.error("Error getting workout progress:", error);
            return null;
        }
    },
    saveWorkoutProgress: (assignmentId, progressData, clientId, trainerId) => {
        const progressRef = doc(db, 'workoutProgress', assignmentId);
        return setDoc(progressRef, {
            progress: progressData,
            clientId: clientId,
            trainerId: trainerId,
            updatedAt: serverTimestamp()
        }, { merge: true }); // Use merge to avoid overwriting other fields
    },
    deleteWorkoutProgress: (assignmentId) => deleteDocument('workoutProgress', assignmentId),
};
