let db;
const request = indexedDB.open("fin_buddy", 3);

request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store (table)
  db.createObjectStore("new_balance", { autoIncrement: true });
  console.log(db);
};

request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;
  // check if app is online, if yes run uploadFunds() function to send all local db data to api
  if (navigator.onLine) {
    uploadFunds();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_balance"], "readwrite");
  // access the object store for `new_balance`
  const financeObjectStore = transaction.objectStore("new_balance");

  // add record to your store with add method
  financeObjectStore.add(record);
}

function uploadFunds() {
  // open a transaction on your db, access it and then get all records
  const transaction = db.transaction(["new_balance"], "readwrite");
  const financeObjectStore = transaction.objectStore("new_balance");
  const getAll = financeObjectStore.getAll();
  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction, access new ones and then clear
          const transaction = db.transaction(["new_balance"], "readwrite");
          const financeObjectStore = transaction.objectStore("new_balance");
          financeObjectStore.clear();
          alert("All saved pizza has been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// checks for locally stored data
window.addEventListener("online", uploadFunds);
