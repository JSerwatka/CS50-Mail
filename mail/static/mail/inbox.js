document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Add send/compose handling
  sendEmailHandling();
});

// Creates new email block for mailbox view
function newEmailBlock(email, emailsView, mailbox) {
  // Create new container
  let emailBlock = document.createElement("div");
  emailBlock.className = "email-block";

  // Save recipiants/sender as a single variable
  let users = (mailbox === "sent") ? email.recipients[0] : email.sender;
  // Show additional recipients count only if overall count is greater than 1 
  let usersCount = ((email.recipients.length > 1) && (mailbox === "sent")) ? `+${email.recipients.length-1}` : "";

  emailBlock.innerHTML = `
    <div class="block-users">${users}</div>
    <div class="users-count">${usersCount}</div>
    <div class="block-subject">${email.subject}</div>
    <div class="block-timestamp">${email.timestamp}</div>
    <div class="trash-icon"><img src="${trashIcon}"></div>
    <!-- <div>Icons made by <a href="http://www.freepik.com/" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div> -->`;
  
  // Listen for email block click -> open the email 
  emailBlock.addEventListener("click", () => {
    openEmail(email)
  })  
  
  // Inject to main mailbox container
  emailsView.appendChild(emailBlock);
}

// Show compose email
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#details-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

// Show mailbox
function load_mailbox(mailbox) {
  // Get main email container
  let emailsView = document.querySelector("#emails-view");
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#details-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Get emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // For each mail - compose a div and inject it into emailsView
      emails.forEach(email => {
        newEmailBlock(email, emailsView, mailbox);
      })

      // Listen for trash icon click -> archive an email
      // TODO: trash
      document.querySelectorAll(".trash-icon").forEach(element => {
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          console.log("trash clicked");
        })
      })
      
  });
}

// Show email
function openEmail(email) {
 
    // Show the details-view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#details-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';


    // Fill with email info
    document.querySelector("#details-view").innerHTML = `
      <div class="email-sender"><b>From:</b> ${email.sender}</div>
      <div class="email-recipients"><b>To:</b> ${email.recipients.join("; ")}</div>
      <div class="email-subject"><b>Subject:</b> ${email.subject}</div>
      <div class="email-timestamp"><b>Timestamp:</b> ${email.timestamp}</div>
      <button class="btn btn-sm btn-outline-primary" id="replay">Replay</button>
      <hr>
      <div class="email-body">${email.body}</div>`;

    // Check email as read if not already
    if (email.read === false){
      fetch(`/emails/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({
          read: true
        })
      })
      .then(response => {
        if (response.status === 204) {
          console.log(`email id:${email.id} is marked as read`)
        } 
        else {
          throw new Error("Unknown error during email mark as read attampt")
        }
      })
      .catch(error => {
        console.log(error)
      })
    }

    //TODO: add replay button logic
}

// Send email function
function sendEmailHandling() {
  document.querySelector("#compose-form").addEventListener("submit", (event) => {
    // Force not to reload
    event.preventDefault();

    // Post an email
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    // Convert response to json
    .then(response => response.json())
    // Show response or throw error
    .then(result => {
      //Throw error if there is one
      if (Object.keys(result)[0] === "error") {
        throw new Error(result.error);
      }
      // Go to inbox and show success message
      else {
        load_mailbox('inbox');
        alert(result.message);
      }       
    })
    // Handle error
    .catch(error => {
      alert(error);
    })
  });
}