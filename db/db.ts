import {Database} from "sqlite3";
import pino from "pino";
import Logger = pino.Logger;

export enum TransactionType {
    buy = 'buy',
    sell = 'sell'
}
export enum TransactionStatus {
    completed = 'completed',
    pending = 'pending',
    failed = 'failed'
}

export class Db {
    db: Database;
    private logger: pino.Logger;

    constructor(logger: Logger) {
        this.logger.debug(`SQLite Database initializing...`)
        this.db = new Database(`solana-sniper-bot.db`);
        this.logger = logger

        try {
            this.initDb()
        } catch (error) {
            this.logger.error(`init DB error: ${error.toString()}`)
        }

        this.logger.debug(`SQLite initialized`)
    }

    updateToken(
        tokenAddress: string,
        isRug: boolean,
        decimals: number,
        lastPrice: string,
    ) {
        const query = `
            INSERT INTO tokens (
                is_rug,
                decimals,
                lastPrice,
                updated_at
            )
            VALUES (
                ${isRug ? '1' : '0'},
                ${decimals},
                ${lastPrice},
                ${Date.now()}
            );
        `

        this.logger.debug(`updateToken query to DB: ${query}`)
        this.db.exec(query, (error) => {
            if (error) {
                return error
            }
        })
    }

    addToken(
        tokenAddress: string,
    ) {
        const query = `
            INSERT INTO tokens (
                token_address,
                created_at,
                updated_at
            )
            VALUES (
                ${tokenAddress},
                ${Date.now()},
                ${Date.now()}
            );
        `

        this.logger.debug(`addToken query to DB: ${query}`)
        this.db.exec(query, (error) => {
            if (error) {
                return error
            }
        })
    }

    addTransaction(
        transactionId: string,
        tokenAddress: string,
        amount: string,
        transactionType: TransactionType,
        pricePerToken: string,
        totalCost: string
    ) {
        const query = `
            INSERT INTO transactions (
                transaction_id,
                token_address,
                amount,
                transaction_type,
                price_per_token,
                total_cost,
                status,
                created_at,
                update_at,
            )
            VALUES (
                ${transactionId},
                ${tokenAddress},
                ${amount},
                ${transactionType},
                ${pricePerToken},
                ${totalCost},
                ${TransactionStatus.pending},
                ${Date.now()},
                ${Date.now()}
            );
        `

        this.logger.debug(`addTransaction query to DB: ${query}`)
        this.db.exec(query, (error) => {
            if (error) {
                return error
            }
        })
    }

    updateTransaction(
        transactionId: string,
        pricePerToken: string,
        totalCost: string,
        status: TransactionStatus,
        statusText: string
    ) {
        const query = `
            UPDATE transactions SET (
                price_per_token,
                total_cost,
                status,
                statusText,
                updated_at
            )
            VALUES (
                ${pricePerToken},
                ${totalCost},
                ${status},
                ${statusText},
                ${Date.now()}
            ) 
            WHERE transaction_id = ${transactionId};
        `

        this.logger.debug(`updateTransaction query to DB: ${query}`)
        this.db.exec(query, (error) => {
            if (error) {
                return error
            }
        })
    }

    initDb() {
        this.db.exec(`
            create table if not exists transactions
            (
                transaction_id TEXT PRIMARY KEY,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                token_address TEXT NOT NULL,
                amount TEXT NOT NULL,
                transaction_type TEXT NOT NULL,
                price_per_token TEXT NOT NULL,
                total_cost TEXT NOT NULL,
                status TEXT NOT NULL,
                statusText TEXT
            );
            create unique index if not exists transaction_id_uindex
                on transactions (transaction_id);
        `);

        this.db.exec(`
            CREATE TABLE if not exists tokens (
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                token_address TEXT PRIMARY KEY,
                decimals INTEGER NOT NULL,
                last_price TEXT,
                is_rug INTEGER DEFAULT 0
            );
            create unique index if not exists token_address_uindex
                on tokens (token_address);
        `);
    }
}
