const check = () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error('No Service Worker support!')
    }
    if (!("PushManager" in window)) {
      throw new Error('No Push API Support!')
    }
}

const displayNotification = (acc) => {
    if (Notification.permission == 'granted') {
        navigator.serviceWorker.getRegistration().then(function(reg) {
        reg.showNotification("A new notification at " + acc , {vibrate: [100, 50, 100]})
        })
    }
}

const renderTable = arr => {
    const container = document.querySelector("#table-container")
    const table = document.createElement("table")
    const headers = document.createElement("tr")
    const cols = ["Account", "Unread Messages", "Remove"]

    cols.forEach(col => {
        const th = document.createElement("th")
        th.innerText = col
        headers.appendChild(th)
    })

    table.appendChild(headers)
    arr.forEach(record => {
        if (!record) { return }
        const row = document.createElement("tr")
        record.forEach(el => {
            const td = document.createElement("td")
            td.innerText = el
            row.appendChild(td)
        })
        table.appendChild(row)
    })

    container.firstChild.replaceWith(table)
}


const main = async () => {
    check()
    navigator.serviceWorker
    .register('/service.js')
    .then(() =>  { console.log("Service Worker Registered") })
    alert("Activate")
    Notification.requestPermission(function(status) {
        console.log('Notification permission status:', status)
    })


    const socket = io()
    socket.on("alert", (devices) => {
        console.log(devices)
        displayNotification(devices[devices.length - 1][0])
        renderTable(devices)

        const audio = new Audio("static/sound.mp3")
        audio.setAttribute("loop", "loop")
        audio.play()
    })

}

main()


// const socket = io()

// socket.on("connect", () => {
//     document.body.style.background = "#000"
//     alert("connected")
// })

// socket.on("data", data => alert(data["message"]))

// b = document.querySelector("button")

// b.addEventListener("click", () => socket.emit("act", {num: 2}))
