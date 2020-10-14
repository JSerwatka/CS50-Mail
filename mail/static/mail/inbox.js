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
    <div class="users">${users}</div>
    <div class="users-count">${usersCount}</div>
    <div class="subject">${email.subject}</div>
    <div class="timestamp">${email.timestamp}</div>`;

  // Inject to main mailbox container
  emailsView.appendChild(emailBlock);
}

// Show compose email
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
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
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Get emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // For each mail - compose a div and inject it to emailsView
      emails.forEach(email => {
        newEmailBlock(email, emailsView, mailbox);
      })      

      // ... do something else with emails ...
  });
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