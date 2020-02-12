'use strict';

const {
    useState,
    useEffect,
} = React;

const buyTicket = (callback, ticket) => {
    fetch('/api/v0/buy', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(ticket)
    })
    .then(r => {
        if(r.ok){
            callback(ticket);
        }
    });
};

const BoughtTicket = ({destination, price}) => {
    return (<li>{destination} <em>Paid: {price} 💰</em></li>);
};
const AvailableTicket = ({destination, price, buyCallback}) => {
    return (<li>{destination}: <em>{price} 💰</em><button onClick={() => buyTicket(buyCallback, {destination, price})}>Buy</button></li>);
};

const App = () => {
    const [user, setUser] = useState({});
    const [accessToken, setAccessToken] = useState();
    const [availableTickets, setAvailableTickets] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const buyCallback = (newTicket) => {
        setMyTickets(myTickets.concat([newTicket]));
    };
    const redirectUri = "http://localhost:8080/"
    useEffect(() => {
        if(window.location.search.slice(1).split("=").indexOf("code") !== -1) {
            const code = window.location.search.slice(1).split("code=")[1];
            fetch('https://foo-tw.eu.auth0.com/oauth/token', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: `audience=teleport-tickets-techsession-api&client_id=k9BRqtBF9q8tWHqWpf96GAeF58t3cMcq&grant_type=authorization_code&code=${code}&code_verifier=9999&redirect_uri=${redirectUri}`,
            }).then(r => r.json())
            .then(r => {
                // TODO at this point you should verify checksums and sigs of the id_token
                const payload = JSON.parse(atob(r.id_token.split('.')[1]));
                setUser(payload);
                setAccessToken(r.access_token);
            });
        }
    },[]);
    useEffect(() => {
        Promise.all([
            fetch('/api/v0/available-tickets')
                    .then(r => r.json()),
            fetch('/api/v0/my-tickets')
                    .then(r => r.json())
            ])
            .then(([availableTickets, myTickets]) => {
                setAvailableTickets(availableTickets);
                setMyTickets(myTickets);
            });
    }, []);
    if(!user.nickname) {
        return (
            <div>
                <h1>Hi Unknown</h1>
                <p>Please <a href="https://foo-tw.eu.auth0.com/authorize?response_type=code&client_id=k9BRqtBF9q8tWHqWpf96GAeF58t3cMcq&redirect_uri=http://localhost:8080&code_challenge=9999&audience=teleport-tickets-techsession-api&scope=openid%20profile">log in</a></p>
            </div>);
    
    }
    return (
        <div>
            <h1>Hi {user.nickname}</h1>
            <h2>Here are the tickets you can buy</h2>
            <ul>
                {availableTickets.map((ticket, index) => (<AvailableTicket key={index} destination={ticket.destination} price={ticket.price} buyCallback={buyCallback}/>))}
            </ul>
            <h2>Here are your tickets</h2>
            <ul>
                {myTickets.map((ticket, index) => (<BoughtTicket key={index} destination={ticket.destination} price={ticket.price} />))}
            </ul>
        </div>);
}

const domContainer = document.querySelector('div.content');
ReactDOM.render((<App/>), domContainer);
