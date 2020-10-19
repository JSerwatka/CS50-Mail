document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // By default, load the inbox
  load_mailbox('inbox');

  // Add send/compose handling
  sendEmailHandling();

  //Backgroud change handling
  backgroudControl();
});

// ------ Shows mailbox ------ 
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

      // Sent mailbox doesn't have option to archive
      if (mailbox !== "sent") {
        // Listen for archive-icon click -> archive an email v unarchive-icon -> unarchive
        document.querySelectorAll(".archive-icon, .unarchive-icon").forEach(element => {
          element.addEventListener("click", (event) => {
            event.stopPropagation();
            // Get email's id
            let email = event.target.parentNode.parentNode;

            // Run hide animation
            email.style.animationPlayState = "running";

            // After animation - archive an email
            email.addEventListener("animationend", () => {
              // Check if archive or unarchive
              let toArchive = (event.target.parentNode.className === "archive-icon") ? true : false;
              
              // Archive/unarchive this email
              archiveControl(email, event.target, toArchive);
            });
          })
        });  
      }
 
  });
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 

// ------ Shows compose an email ------ 
function compose_email(replyEmail=null) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#details-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // If this is a reply - populate with data
  if (replyEmail !== null) {
    document.querySelector('#compose-recipients').value = replyEmail.sender;
    // Body = sender's mail + timestamp
    document.querySelector('#compose-body').value = `
    " On ${replyEmail.timestamp} ${replyEmail.sender} wrote: 
     ${replyEmail.body}"`;
    // Add Re: only if it's a first reply
    if (replyEmail.subject.slice(0,3) === "Re:") {
      document.querySelector('#compose-subject').value = replyEmail.subject;
    }
    else {
      document.querySelector('#compose-subject').value = "Re: " + replyEmail.subject;
    }
  }
  // Else - clear out composition fields
  else {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 

// ------ Shows email's details ------ 
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
    <button class="btn btn-sm btn-outline-primary" id="reply"><img src="${replyBlueIcon}">Reply</button>
    <!--Icons made by <a href="https://www.flaticon.com/authors/pixel-perfect" title="Pixel perfect">Pixel perfect</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>-->
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

  let replyButton = document.querySelector("#reply");

  // Change color of reply icon if it's hover state or not
  replyButton.addEventListener("mouseover", () => {
    replyButton.firstElementChild.src = `${replyWhiteIcon}`;
  })

  replyButton.addEventListener("mouseout", () => {
    replyButton.firstElementChild.src = `${replyBlueIcon}`;
  })

  // Compose a reply template
  replyButton.addEventListener("click", () => {
    compose_email(email);
  })
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 

// ------ Sends email ------ 
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
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 

// ------ Creates new email block for mailbox view  ------ 
function newEmailBlock(email, emailsView, mailbox) {
  // Create new container
  let emailBlock = document.createElement("div");
  emailBlock.className = "email-block";
  emailBlock.id = email.id;
  
  // Apply unread bg if mail unread
  if (!email.read) {
    emailBlock.classList.add("unread");
  } 

  // Save recipiants/sender as a single variable
  let users = (mailbox === "sent") ? email.recipients[0] : email.sender;
  // Show additional recipients count only if overall count is greater than 1 
  let usersCount = ((email.recipients.length > 1) && (mailbox === "sent")) ? `+${email.recipients.length-1}` : "";
  // Check if email archived or unarchived and set proper variables
  let isArchivedIcon = (email.archived) ? unarchiveIcon : archiveIcon;
  let isArchivedClass = (email.archived) ? "unarchive-icon" : "archive-icon";

  emailBlock.innerHTML = `
    <div class="block-users">${users}</div>
    <div class="users-count">${usersCount}</div>
    <div class="block-subject">${email.subject}</div>
    <div class="block-timestamp">${email.timestamp}</div>
    <div class=${isArchivedClass}><img src="${isArchivedIcon}"></div>
    <!-- <div>Icons made by <a href="http://www.freepik.com/" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div> -->`;
  
  // Hide archive button for sent mailbox
  if (mailbox === "sent") {
    emailBlock.querySelector(".archive-icon").classList.add("hidden");
  }

  // Listen for email block click -> open the email 
  emailBlock.addEventListener("click", () => {
    openEmail(email)
  })  
  
  // Inject to the main mailbox container
  emailsView.appendChild(emailBlock);
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 

// ------ Archives/Unarchives email ------ 
function archiveControl(email, icon, toArchive) {
  // Update archive/unarchive status
  fetch(`/emails/${email.id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: toArchive
    })
  })
  .then(response => {
    if (response.status === 204) {
      // Change icon trash->unarchive unarchive->trash
      if (toArchive) {
        console.log(`email id:${email.id} is marked as archived`)
        icon.src = unarchiveIcon;
        icon.parentNode.className = "unarchive-icon"
      }
      else {
        console.log(`email id:${email.id} is marked as unarchived`)
        icon.src = archiveIcon;
        icon.parentNode.className = "archive-icon"
      }
      // Refresh the page
      load_mailbox('inbox');
    } 
    else {
      throw new Error("Unknown error during email mark as archived attampt")
    }
  })
  .catch(error => {
    console.log(error)
  })
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 

// ------ Controls backgroud selection from dropdown menu ------ 
function backgroudControl() {
  let bodyNode = document.querySelector("body");
  let checkbox = document.querySelector("#animation-checkbox");
  let shoutout = document.querySelector("div.shoutout");
  

  // Control checkbox - run/pause animation
  checkbox.addEventListener("change", () => {
    bodyNode.style.animationPlayState = (checkbox.checked) ? "running" : "paused";
  })

  // Control radios - change backgroud
  document.querySelectorAll(".dropdown-item input[name='backgroud']").forEach(radio => {
    radio.addEventListener("change", () => {
      let selectedBg = document.querySelector('input[name="backgroud"]:checked').value;
      shoutout.style.visibility = "visible";
      // Add info about photo
      switch (selectedBg) {
        case "abstract-1":
          shoutout.innerHTML = 'Photo by <a href="https://unsplash.com/@pawel_czerwinski?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Paweł Czerwiński</a> on <a href="https://unsplash.com/?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a>';
          break;
        case "abstract-2":
          shoutout.innerHTML = 'Photo by <a href="https://unsplash.com/@ewxy?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">W</a> on <a href="https://unsplash.com/?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a>';
          break;
        case "abstract-3":
          shoutout.innerHTML = 'Photo by <a href="https://unsplash.com/@korpa?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Jr Korpa</a> on <a href="https://unsplash.com/?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a>';
          break;
        case "abstract-4":
          shoutout.innerHTML = 'Photo by <a href="https://unsplash.com/@korpa?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Jr Korpa</a> on <a href="https://unsplash.com/?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a>';
          break;      
        case "gradient":
          shoutout.innerHTML = '';
          shoutout.style.visibility = "hidden";
          //
          break;      
        default:
          console.log("invalid item");
          break;
      }

      bodyNode.className = selectedBg;
      bodyNode.prepend(shoutout);
    });
  }); 
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 