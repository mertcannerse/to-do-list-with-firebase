import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy,
  deleteDoc,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider("microsoft.com");
const db = getFirestore(app);

class TodoApp {
  constructor() {
    this.loading = document.getElementById("loading");

    this.formContainer = document.getElementById("form-container");

    this.loginForm = document.getElementById("login-form");
    this.loginEmail = document.getElementById("login-email");
    this.loginPassword = document.getElementById("login-password");
    this.loginButton = document.getElementById("login-button");

    this.googleAuthButton = document.getElementById("google-auth-button");
    this.microsoftAuthButton = document.getElementById("microsoft-auth-button");

    this.registerForm = document.getElementById("register-form");
    this.registerEmail = document.getElementById("register-email");
    this.registerPassword = document.getElementById("register-password");
    this.registerButton = document.getElementById("register-button");

    this.modal = document.getElementById("modal");
    this.openModalButton = document.getElementById("open-modal-button");
    this.closeModalButton = document.getElementById("close-modal-button");

    this.userProfile = document.getElementById("user-profile");

    this.profile = document.getElementById("profile");
    this.profileDisplayNameInput = document.getElementById(
      "profile-display-name-input"
    );
    this.profilePhotoURL = document.getElementById("profile-photo-url");
    this.profileUpdateButton = document.getElementById("profile-update-button");
    this.emailVerifiedButton = document.getElementById("email-verified-button");
    this.logoutButton = document.getElementById("logout-button");

    this.todo = document.getElementById("todo");
    this.todoInput = document.getElementById("todo-input");
    this.todoList = document.getElementById("todo-list");
    this.addTodoButton = document.getElementById("add-todo-button");

    this.todoEmailVerifiedError = document.getElementById(
      "todo-email-verified-error"
    );

    this.loginError = document.getElementById("login-error");
    this.registerError = document.getElementById("register-error");

    this.loginButton.addEventListener("click", this.login.bind(this));
    this.loginButton.addEventListener("click", () => {
      this.login();
    });

    this.googleAuthButton.addEventListener("click", this.googleAuth.bind(this));
    this.microsoftAuthButton.addEventListener(
      "click",
      this.microsoftAuth.bind(this)
    );

    this.registerButton.addEventListener("click", this.register.bind(this));
    this.logoutButton.addEventListener("click", this.logout.bind(this));
    this.emailVerifiedButton.addEventListener(
      "click",
      this.emailVerification.bind(this)
    );
    this.profileUpdateButton.addEventListener(
      "click",
      this.updateProfile.bind(this)
    );

    this.profileDisplayNameInput.addEventListener("input", () => {
      this.checkProfileInputs();
    });

    this.profilePhotoURL.addEventListener("input", () => {
      this.checkProfileInputs();
    });

    this.addTodoButton.addEventListener("click", this.addTodo.bind(this));

    this.todoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !this.addTodoButton.disabled) {
        this.addTodo();
      }
    });

    this.todoInput.addEventListener("input", () => {
      this.checkTodoInput(this);
    });

    this.loginEmail.addEventListener("input", this.checkLoginInputs.bind(this));
    this.loginPassword.addEventListener(
      "input",
      this.checkLoginInputs.bind(this)
    );

    this.registerEmail.addEventListener(
      "input",
      this.checkRegisterInputs.bind(this)
    );
    this.registerPassword.addEventListener(
      "input",
      this.checkRegisterInputs.bind(this)
    );

    this.loginButton.disabled = true;
    this.registerButton.disabled = true;
    this.addTodoButton.disabled = true;
    this.profileUpdateButton.disabled = true;

    this.checkAuthState();
  }

  checkAuthState() {
    if (!auth.user) {
      this.loading.style.display = "block";

      this.formContainer.style.display = "none";
      this.profile.style.display = "none";
      this.todo.style.display = "none";
    } else {
      this.loading.style.display = "none";
    }

    auth.onAuthStateChanged((user) => {
      if (user) {
        this.loading.style.display = "none";

        this.formContainer.style.display = "none";
        this.profile.style.display = "grid";
        this.todo.style.display = "grid";

        this.todoEmailVerifiedError.style.display = "none";

        this.loginError.innerHTML = "";
        this.registerError.innerHTML = "";

        this.profileDisplayNameInput.value = user.displayName;
        this.profilePhotoURL.value = user.photoURL;

        this.googleAuth();
        this.getUserProfile();
        this.emailVerification();
        this.updateProfileModal();
        this.updateProfile();
        this.loadTodoList();
      } else {
        this.loading.style.display = "none";

        this.loginError.innerHTML = "";
        this.registerError.innerHTML = "";

        this.formContainer.style.display = "grid";
        this.profile.style.display = "none";
        this.todo.style.display = "none";
      }
    });
  }

  async googleAuth() {
    const user = auth.currentUser;

    if (!user) {
      await signInWithPopup(auth, googleProvider)
        .then((result) => {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential.accessToken;
          const user = result.user;
          const displayName = user.displayName;
          const email = user.email;
          const photoURL = user.photoURL;
        })
        .catch((error) => {
          console.error(error.message);
        });
    }
  }

  async microsoftAuth() {
    const user = auth.currentUser;

    if (!user) {
      try {
        const provider = new OAuthProvider("microsoft.com");
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error(error.message);
      }
    }
  }

  emailVerification() {
    const user = auth.currentUser;
    if (user.emailVerified) {
      this.emailVerifiedButton.style.display = "none";
    } else {
      this.emailVerifiedButton.style.display = "block";

      this.emailVerifiedButton.addEventListener("click", () => {
        sendEmailVerification(user);
      });
    }
  }

  getUserProfile() {
    const user = auth.currentUser;
    if (user) {
      const displayName = user.displayName;
      const email = user.email;
      const photoURL = user.photoURL;

      let userProfileText = `Welcome, ${
        displayName ? displayName : ""
      } (${email})`;

      if (photoURL) {
        userProfileText = `<img class='photoURL' src=${photoURL} /> ${userProfileText}`;
      }

      this.userProfile.innerHTML = userProfileText;
    }
  }

  updateProfileModal() {
    this.openModalButton.addEventListener("click", () => {
      this.modal.style.display = "grid";
    });

    this.closeModalButton.addEventListener("click", () => {
      this.modal.style.display = "none";
    });
  }

  updateProfile() {
    const user = auth.currentUser;
    if (user) {
      const displayName = this.profileDisplayNameInput.value;
      const photoURL = this.profilePhotoURL.value;

      if (!this.isProfileInputValid(displayName, photoURL)) {
        return;
      }

      updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL,
      })
        .then(() => {
          this.modal.style.display = "none";
          this.getUserProfile();
        })
        .catch((error) => {
          console.log(error.message);
        });
    }
  }

  isProfileInputValid(displayName, photoURL) {
    if (!displayName && !photoURL) {
      this.profileUpdateButton.disabled = true;
      return false;
    }

    const displayNameRegex = /^[A-Za-z\s]+$/;
    if (!displayNameRegex.test(displayName)) {
      this.profileUpdateButton.disabled = true;
      return false;
    }

    const urlRegex = /^(http|https):\/\/\S+$/;
    if (!urlRegex.test(photoURL)) {
      this.profileUpdateButton.disabled = true;
      return false;
    }

    this.profileUpdateButton.disabled = false;
    return true;
  }

  checkProfileInputs() {
    const displayNameValue = this.profileDisplayNameInput.value;
    const photoURLValue = this.profilePhotoURL.value;

    if (displayNameValue === "" && photoURLValue === "") {
      this.profileUpdateButton.disabled = true;
      return;
    }

    const displayNameRegex = /^[A-Za-z\s]+$/;
    if (!displayNameRegex.test(displayNameValue)) {
      this.profileUpdateButton.disabled = true;
      return;
    }

    const urlRegex = /^(http|https):\/\/\S+$/;
    if (!urlRegex.test(photoURLValue)) {
      this.profileUpdateButton.disabled = true;
      return;
    }

    this.profileUpdateButton.disabled = false;
  }

  checkLoginInputs() {
    const emailValue = this.loginEmail.value;
    const passwordValue = this.loginPassword.value;
    this.loginButton.disabled = !(emailValue && passwordValue);
  }

  checkRegisterInputs() {
    const emailValue = this.registerEmail.value;
    const passwordValue = this.registerPassword.value;
    this.registerButton.disabled = !(emailValue && passwordValue);
  }

  async login() {
    try {
      const loginEmail = this.loginEmail.value;
      const loginPassword = this.loginPassword.value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginEmail)) {
        this.loginError.innerHTML = "Enter a valid e-mail address.";
        return;
      }

      if (loginPassword.length < 6) {
        this.loginError.innerHTML = "Password must be at least 6 characters.";
        return;
      }

      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);

      this.loginEmail.value = "";
      this.loginPassword.value = "";

      return true;
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        this.loginError.innerHTML = "Wrong password.";
      } else if (error.code === "auth/user-not-found") {
        this.loginError.innerHTML = "User not found.";
      } else {
        console.log(error.message);
      }
    }
  }

  async logout() {
    await signOut(auth)
      .then(() => {
        this.profileDisplayNameInput.value = "";
        this.profilePhotoURL.value = "";

        this.loginEmail.value = "";
        this.loginPassword.value = "";
        this.registerEmail.value = "";
        this.registerPassword.value = "";

        this.loginButton.disabled = true;
        this.registerButton.disabled = true;
        this.addTodoButton.disabled = true;
        this.profileUpdateButton.disabled = true;

        this.todoInput.value = "";

        this.todoEmailVerifiedError.style.display = "none";

        return auth;
      })
      .catch((error) => {
        console.log(error.message);
      });
  }

  async register() {
    try {
      const registerEmail = this.registerEmail.value;
      const registerPassword = this.registerPassword.value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerEmail)) {
        this.registerError.innerHTML = "Enter a valid e-mail address.";
        return;
      }

      if (registerPassword.length < 6) {
        this.registerError.innerHTML =
          "Password must be at least 6 characters.";
        return;
      }

      await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        registerPassword
      );

      this.registerEmail.value = "";
      this.registerPassword.value = "";

      return true;
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        this.registerError.innerHTML = "E-mail already in use.";
      } else {
        console.log(error.message);
      }
    }
  }

  loadTodoList() {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const todosRef = query(
        collection(db, "todos"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      onSnapshot(todosRef, (querySnapshot) => {
        this.todoList.innerHTML = "";

        querySnapshot.forEach((docs) => {
          const data = docs.data();
          const todoItem = document.createElement("div");
          todoItem.classList.add("todoItem");

          const todoText = document.createElement("span");
          todoText.textContent = data.text;
          todoItem.appendChild(todoText);

          todoText.addEventListener("click", () => {
            const newCompletedValue = !data.completed;
            updateDoc(doc(db, "todos", docs.id), {
              completed: newCompletedValue,
            });
          });

          todoText.classList.add(data.completed ? "completed" : "notCompleted");

          const todoButtons = document.createElement("div");
          todoButtons.classList.add("todoButtons");

          const editButton = document.createElement("button");
          editButton.classList.add("editButton");
          editButton.textContent = "Edit";
          editButton.addEventListener("click", () => {
            this.editTodo(data, docs.id, todoText, todoItem);
          });
          todoButtons.appendChild(editButton);

          const deleteButton = document.createElement("button");
          deleteButton.classList.add("deleteButton");
          deleteButton.textContent = "Delete";
          deleteButton.addEventListener("click", () => {
            deleteDoc(doc(db, "todos", docs.id));
          });

          todoButtons.appendChild(deleteButton);
          todoItem.appendChild(todoButtons);
          this.todoList.appendChild(todoItem);
        });
      });
    }
  }

  editTodo(data, todoId, currentText, todoItem) {
    const todoText = currentText.textContent;

    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.value = todoText;
    inputElement.classList.add("editInput");

    const todoButtons = todoItem.querySelector(".todoButtons");
    todoButtons.style.display = "none";
    const editButtons = document.createElement("div");

    const saveButton = document.createElement("button");
    saveButton.classList.add("saveButton");
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", () => {
      const newText = inputElement.value;
      updateDoc(doc(db, "todos", todoId), { text: newText });

      inputElement.style.display = "none";
      editButtons.style.display = "none";

      currentText.textContent = newText;
      currentText.style.display = "inline";

      todoButtons.style.display = "inline";
    });

    const cancelButton = document.createElement("button");
    cancelButton.classList.add("cancelButton");
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", () => {
      inputElement.style.display = "none";
      editButtons.style.display = "none";

      currentText.style.display = "inline";

      todoButtons.style.display = "inline";
    });

    inputElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveButton.click();
      }
    });

    editButtons.appendChild(saveButton);
    editButtons.appendChild(cancelButton);

    todoItem.appendChild(inputElement);
    todoItem.appendChild(editButtons);

    currentText.style.display = "none";
  }

  checkTodoInput() {
    const todoText = this.todoInput.value;
    this.addTodoButton.disabled = todoText === "";
  }

  async addTodo() {
    const todoText = this.todoInput.value;
    const user = auth.currentUser;

    if (user && user.emailVerified) {
      const todoRef = await addDoc(collection(db, "todos"), {
        userId: user.uid,
        text: todoText,
        completed: false,
        createdAt: serverTimestamp(),
      });

      this.todoInput.value = "";

      return todoRef;
    } else if (!user.emailVerified) {
      this.todoEmailVerifiedError.style.display = "block";
      this.todoEmailVerifiedError.innerHTML =
        "You cannot add a todo without confirming the e-mail address.";
    }
  }
}

const todoApp = new TodoApp();
