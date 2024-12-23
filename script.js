const axios = require('axios');

const apiUrl = 'https://api.scan.orai.io/v1/txs-account';
const targetAddress = 'orai1r7yaje0em3f4s9g2cwl37qsypnh2sf8wce4qsr';
const limit = 100; // Number of transactions to fetch per page

async function getAllTransactions(address) {
    let page = 1;
    let transactions = [];
    let hasMore = true;

    while (hasMore) {
        try {
            const url = `${apiUrl}/${address}?limit=${limit}&page_id=${page}`;
            console.log(`Fetching transactions from: ${url}`);
            const response = await axios.get(url);

            const { data, page: pageInfo } = response.data;
            transactions = transactions.concat(data);

            hasMore = page < pageInfo.total_page;
            page += 1;
        } catch (error) {
            console.error('Error fetching transactions:', error.message);
            hasMore = false;
        }
    }

    return transactions;
}

function calculateSenderAmounts(transactions, targetAddress) {
    const senders = {};

    transactions.forEach((tx) => {
        tx.messages.forEach((message) => {
            if (message['@type'] === '/cosmos.bank.v1beta1.MsgSend' &&
                message.to_address === targetAddress) {
                const fromAddress = message.from_address;
                const amount = message.amount.reduce((sum, amt) => {
                    if (amt.denom === 'orai') {
                        return sum + parseInt(amt.amount, 10);
                    }
                    return sum;
                }, 0);

                if (!senders[fromAddress]) {
                    senders[fromAddress] = 0;
                }
                senders[fromAddress] += amount;
            }
        });
    });

    return senders;
}

async function main() {
    console.log('Fetching all transactions...');
    const transactions = await getAllTransactions(targetAddress);

    console.log('Calculating sender amounts...');
    const senderAmounts = calculateSenderAmounts(transactions, targetAddress);

    console.log('Results:');
    Object.entries(senderAmounts).forEach(([sender, amount]) => {
        console.log(`Wallet: ${sender}, Total ORAI Sent: ${amount / 1000000} ORAI`);
    });
}

// Run the script
main().catch((error) => console.error('Error:', error.message));