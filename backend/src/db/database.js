// In-memory store — works on serverless (Vercel) and local dev
let store = {
  users: [],
  watchlists: [],
  assets: [],
  signals: [],
  paper_trades: [],
  journal_entries: [],
  alerts: [],
  strategies: [],
  backtest_results: [],
  user_settings: [],
};

function initDatabase() {
  console.log('In-memory database initialized');
}

function getDb() {
  return {
    get: (collection) => ({
      value: () => store[collection] || [],
      find: (query) => ({
        value: () => (store[collection] || []).find(item =>
          Object.entries(query).every(([k, v]) => item[k] === v)
        ),
        assign: (updates) => ({
          write: () => {
            const idx = (store[collection] || []).findIndex(item =>
              Object.entries(query).every(([k, v]) => item[k] === v)
            );
            if (idx !== -1) Object.assign(store[collection][idx], updates);
          }
        })
      }),
      filter: (query) => ({
        value: () => (store[collection] || []).filter(item =>
          Object.entries(query).every(([k, v]) => item[k] === v)
        ),
        remove: () => ({
          write: () => {
            store[collection] = (store[collection] || []).filter(item =>
              !Object.entries(query).every(([k, v]) => item[k] === v)
            );
          }
        })
      }),
      push: (item) => ({
        write: () => { (store[collection] = store[collection] || []).push(item); }
      }),
      remove: (query) => ({
        write: () => {
          store[collection] = (store[collection] || []).filter(item =>
            !Object.entries(query).every(([k, v]) => item[k] === v)
          );
        }
      }),
    }),
  };
}

module.exports = { getDb, initDatabase };
