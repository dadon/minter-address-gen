import * as fs from "fs";
import { generateWallet } from "minterjs-wallet";

const OUTPUT_DIR = "output";
const HEX_ALPHABET = "0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f".split(",");

function save(name, obj) {
    fs.writeFileSync(`${OUTPUT_DIR}/${name}.json`, JSON.stringify(obj));
}

export function generateWallets(words: string[]) {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    const step = 10000;
    let i = 0;
    let currentTime = Date.now();

    while (true) {
        const wallet = generateWallet();
        const address = wallet.getAddressString();

        let needSave = false;
        let walletData = {
            matched: []
        };

        // check 4+ repeat
        for (let symbol of HEX_ALPHABET) {
            const re = new RegExp(symbol + "{5,}", "g");

            if (re.test(address)) {
                needSave = true;
                walletData.matched.push("5+symbol=" + symbol);
            }
        }

        // check if only numbers
        const numRe = new RegExp("^Mx[0-9]{40}$");
        if (numRe.test(address)) {
            needSave = true;
            walletData.matched.push("num");
        }

        // check if only letters
        const letterRe = new RegExp("^Mx[a-f]{40}$");
        if (letterRe.test(address)) {
            needSave = true;
            walletData.matched.push("letter");
        }

        // check words
        for (let word of words) {
            if (address.startsWith("Mx" + word)) {
                walletData.matched.push("fword=" + word);
            }
        }

        // check 78
        if (address.indexOf("78") !== -1) {
            const userWalletRe = new RegExp("^Mx78[a-f0-9]{34}78[a-f0-9]{2}$");
            if (userWalletRe.test(address)) {
                walletData.matched.push("userPattern");
            } else {
                const count = address.split("78").length - 1;
                if (count > 3) {
                    walletData.matched.push("78");
                }
            }
        }

        if (walletData.matched.length > 0) {
            const matchType = walletData.matched.join(",");
            console.log(`Save wallet (${matchType}) ${address}`);
            walletData["pk"] = wallet.getPrivateKeyString();
            walletData["mnemonic"] = wallet.getMnemonic();
            save(`wallet_${matchType}_${address}`, walletData);
        }

        i++;

        if (i % step === 0) {
            const now = Date.now();
            const delta = now - currentTime;
            currentTime = now;

            console.log(`Create ${step} iteration for ${delta / 1000}s`);
        }
    }
}
