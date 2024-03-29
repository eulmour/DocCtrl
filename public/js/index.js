//import {record} from './data.js'

// set the color of the active sidebar element
const sidebar_items = document.getElementsByClassName("sidebar_caption");

sidebar_items[0].style.backgroundColor = 'rgb(143, 201, 255)';
sidebar_items[0].style.color = 'rgb(0, 0, 0)';

const sections = {
    main_section : document.querySelector('#main_section'),
    control_section : document.querySelector('#control_section'),
    report_section : document.querySelector('#report_section'),
    settings_section : document.querySelector('#settings_section') 
}

for(elem of sidebar_items) {

    elem.addEventListener("click", (evt) => {

        for(let i = 0; i < evt.currentTarget.myCollection.length; ++i)
        {
            Object.values(sections)[i].hidden = false;

            if(evt.currentTarget.myCollection[i] != evt.currentTarget)
            {
                evt.currentTarget.myCollection[i].style.color = "rgb(0, 0, 0)";
                evt.currentTarget.myCollection[i].style.backgroundColor = 'rgb(255, 255, 255)';
                Object.values(sections)[i].hidden = true;
            }
        }
            evt.currentTarget.style.color = 'rgb(0, 0, 0)';
            evt.currentTarget.style.backgroundColor = 'rgb(143, 201, 255)';

    }, false);

    elem.myCollection = sidebar_items;
}

// load the table when the page was loaded
document.addEventListener('DOMContentLoaded', () => {
    fetch('/getTable/Record')
    .then(response => response.json())
    .then(data => loadRecordTable(data['data']));
    
    if (!document.cookie)
        window.location.href = "/logout";

    localStorage.setItem("bCreateNewRecord", "true");

    const userData = document.cookie.split("; ").reduce((a, c) => {
        let [n, v] = c.split("=");
        return {
            ...a,[n]:decodeURIComponent(v)
        };
    }, {});

    const {
        UserID,
        Username,
        Email,
        Fullname,
        Position,
        Phone,
        RegistrationDate
    } = JSON.parse(userData['user']);

    const headerAuth = document.querySelector('#headerAuth');
    const headerUser = document.querySelector('#headerUser');
    const headerUserUsername = document.querySelector('#headerUserUsername');

    if (Username) {
        headerAuth.hidden = true;
        headerUser.hidden = false;
        headerUserUsername.innerHTML = "▼ " + Username;

        localStorage.setItem("iCurrentUserID", UserID);
        localStorage.setItem("sCurrentUsername", Username);
        localStorage.setItem("sCurrentEmail", Email);
        localStorage.setItem("sCurrentUserFullName", Fullname);
        localStorage.setItem("sCurrentUserPosition", Position);
        localStorage.setItem("sCurrentUserPhone", Phone);
        localStorage.setItem("sCurrentUserRegDate", RegistrationDate);
    } else {
        window.location.href = "/logout";
    }
});

const funEditRecord = (event) => {
    if(event.target.className === 'edit_row_btn') {
        localStorage.setItem("iCurrentDocumentIndex", event.target.dataset.id);
        localStorage.setItem("sCurrentDocumentStatus", "Проект");
        localStorage.setItem("bCreateNewRecord", "false");
        window.location.href = "editing";
    }
    if(event.target.className === 'delete_row_btn') {
        deleteRowById("Record", event.target.dataset.id);
    }
};

// set the elements in the table clickable
document.querySelector('#table_records tbody').addEventListener('click', funEditRecord);
document.querySelector('#table_draft_records tbody').addEventListener('click', funEditRecord);
document.querySelector('#table_filtered_records tbody').addEventListener('click', funEditRecord);

document.querySelector('#toolbarCreateRecordBtn').addEventListener('click', (event) => {

    if (!document.cookie) {
        window.location.href = "/logout";
    }

    fetch('/insertDocumentDraft')
    .then(response => response.json())
    .then(data => {
        localStorage.setItem("iCurrentDocumentIndex", data.data.insertId);
        localStorage.setItem("sCurrentDocumentStatus", data.data.Status);
        localStorage.setItem("bCreateNewRecord", "true");
    });
});

// filtering
document.querySelector('#filter_btn').onclick = () => {
    const start_date    = document.querySelector('#filter_start_date').value;
    const end_date      = document.querySelector('#filter_end_date').value;
    const actual        = document.querySelector('#filter_is_actual').checked;
    const outdated      = document.querySelector('#filter_is_outdated').checked;
    const category      = document.querySelector('#category').value;
    const kind          = document.querySelector('#kind').value;
    const status        = document.querySelector('#status').value;


    const table         = document.querySelector('#table_filtered_records tbody');
    const section       = document.getElementsByClassName("filtered_docs")[0];

    fetch(`/getFiltered/?table=Record&start=${start_date}&end=${end_date}&isactual=${actual}&isoutdated=${outdated}&category=${category}&kind=${kind}&status=${status}`)
    .then(response => response.json())
    .then(data => loadFilteredRecordTable(table, data['data']));

    section.hidden = false;
}

document.querySelector('#generate_report_btn').onclick = () => {
    window.location.href = "report_view";
}

/////////////////////////////////////////////////////////////////////////////////
// functions                                                                   //
/////////////////////////////////////////////////////////////////////////////////

function deleteRowById(table, id) {
    fetch('/delete/' + id, {
        headers: {
            'Content-type': 'application/json'
        },
        method: 'DELETE',
        body: JSON.stringify({
            table : table
        }, null, '\t')
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            location.reload();
        }
    });
}

function loadStatistics(data) {
    const count_label = document.querySelector('#count_label');

    let inr = "";

    inr = '▼ Результат&nbsp;&nbsp;';
    inr += '<div style="color: #666666;">';
    inr += '(';
    inr += `Действующие: ${data.actualCount}.&nbsp;`;
    inr += `Просроченные: ${data.outdatedCount}.&nbsp;`;
    inr += `Завершенные: ${data.finishedCount}`;
    inr += ')';
    inr += '</div>';

    count_label.innerHTML = inr;
}

function loadRecordTable(data) {
    const table = document.querySelector('#table_records tbody');
    const table_draft = document.querySelector('#table_draft_records tbody');

    if(data.length === 0) {
        table.innerHTML = "<tr><td class='no-data' colspan='7'><div style='margin: 0 auto; text-align: center;'>Нет записей</div></td></tr>";
        table_draft.innerHTML = "<tr><td class='no-data' colspan='4'><div style='margin: 0 auto; text-align: center;'>Нет записей</div></td></tr>";
        return;
    }
    
    let tableHTML = "";
    let tableHTMLDraft = "";
    data.forEach(({RecordID, Performer, Number, Header, DocumentDate, ChangeDate, Status}) => {

        if (Status != "Проект") {
            tableHTML += "<tr>";
            tableHTML += `<td>${Performer}</td>`;
            tableHTML += `<td>${Header}</td>`;
            tableHTML += `<td>${Status}</td>`;
            tableHTML += `<td>${Number}</td>`;
            tableHTML += `<td>${DocumentDate.slice(0, 10)}</td>`;
            tableHTML += `<td><button class="edit_row_btn" data-id=${RecordID}>Откр.</td>`;
            tableHTML += `<td><button class="delete_row_btn" data-id=${RecordID}>&times;</td>`;
            tableHTML += "</tr>";
        }
        if (Status == "Проект") {
            tableHTMLDraft += "<tr>";
            tableHTMLDraft += `<td>${Header}</td>`;
            tableHTMLDraft += `<td>${ChangeDate?.slice(0, 10).replace('T', ' ')}</td>`;
            tableHTMLDraft += `<td><button class="edit_row_btn" data-id=${RecordID}>Откр.</td>`;
            tableHTMLDraft += `<td><button class="delete_row_btn" data-id=${RecordID}>&times;</td>`;
            tableHTMLDraft += "</tr>";
        }

    });

    table.innerHTML = tableHTML;
    table_draft.innerHTML = tableHTMLDraft;

    // loadStatistics({ actualCount, outdatedCount, finishedCount, validatedCount });
}

function loadFilteredRecordTable(table, body) {
    
    if(body.length === 0) {
        table.innerHTML = "<tr><td class='no-data' colspan='7'><div style='margin: 0 auto; text-align: center;'>Нет записей</div></td></tr>";
        return;
    }

    table.innerHTML = "";
    let tableRow = ``;
    body.forEach(({RecordID, Performer, Number, Header, DocumentDate, Status}) => {
        tableRow += "<tr>";
        tableRow += `<td>${Performer}</td>`;
        tableRow += `<td>${Header}</td>`;
        tableRow += `<td>${Status}</td>`;
        tableRow += `<td>${Number}</td>`;
        tableRow += `<td>${DocumentDate.slice(0, 10)}</td>`;
        tableRow += `<td><button class="edit_row_btn" data-id=${RecordID}>Откр.</td>`;
        tableRow += `<td><button class="delete_row_btn" data-id=${RecordID}>&times;</td>`;
        tableRow += "</tr>";
    });

    table.innerHTML += tableRow; 
}

const getCookieValue = (name) => (
    document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
)
