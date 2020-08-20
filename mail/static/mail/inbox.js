document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener( 'submit', submit_form);
  // By default, load the inbox
  load_mailbox('inbox');
});

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    emails.forEach(x => add_mail(x, mailbox));

  });

}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#form-error').innerHTML = '';
}

function submit_form(event){

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {

  if(result.message == null){

    document.querySelector('#form-error').innerHTML = result.error;
  }
  else{
    load_mailbox('sent');
  }
    
  });

  event.preventDefault();
}

// Add a new mail with given contents to DOM
function add_mail(contents, mailbox) {

  const mail_container = document.createElement('div');

  if(contents.read)
  {
    mail_container.className = "readmail d-flex justify-content-between list-group-item list-group-item-action";
  }
  else
  {
    mail_container.className = "unreadmail d-flex justify-content-between list-group-item list-group-item-action";
  }

  const mail_template = create_mail_template(contents, mailbox);

  mail_container.innerHTML = mail_template;

  mail_container.addEventListener('click', function() {
    const element = event.target;
    if (element.className === 'hide') {
      if(mailbox === 'inbox')
      {
        archive_mail(element.parentElement, contents.id, true);
      }
      else if (mailbox === 'archive')
      {
        archive_mail(element.parentElement, contents.id, false);
      }
    }
    else{
      get_mail(contents.id);
    }
});
  // Add mail to DOM
  document.querySelector('#emails-view').append(mail_container);
}

function create_mail_template(contents, mailbox){
  
  var mail_template = `<div><b>${contents.subject}</b><br>`;

  if(mailbox === 'sent'){
    mail_template += `To: ${contents.recipients}</div>`;
  }
  else{
    mail_template += `From: ${contents.sender}</div>`;
  }

  mail_template += `<div>${contents.timestamp}   `;

  if(mailbox === 'inbox')
  {
    mail_template += '<button class="hide">Archive</button>';
  }
  else if (mailbox === 'archive')
  {
    mail_template +='<button class="hide">Unarchive</button>';
  }
  mail_template += '</div>';
  return mail_template;
}

function archive_mail(mail_element, email_id, archived_state){
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: archived_state
      })
    })
    mail_element.style.animationPlayState = 'running';
    mail_element.addEventListener('animationend', () =>  {
    mail_element.remove();
  
    if (archived_state === false)
    {
    load_mailbox('inbox');
    }
  });
}


function get_mail(email_id){

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    view_mail(email);
  });
}

function view_mail(email){

  // Set read flag to true
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
// Create mail view
document.querySelector('#email-subject').innerHTML = `<b>Subject: </b>${email.subject}`;
document.querySelector('#email-recipients').innerHTML = `<b>To: </b>${email.recipients}`;
document.querySelector('#email-sender').innerHTML = `<b>From: </b>${email.sender}`;
document.querySelector('#email-timestamp').innerHTML = `<b>Timestamp: </b>${email.timestamp}`;
document.querySelector('#email-body').innerHTML = `${email.body}`;

document.querySelector('#email-reply').addEventListener('click', function() {
    reply(email);
});
}

function reply(email){
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    var subject;
    if(email.subject.startsWith("Re: ")){
      subject = email.subject;
    }
    else{
      subject = `Re: ${email.subject}`;
    }
    const body = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = email.recipients;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;
}