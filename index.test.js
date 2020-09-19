const Urusai = require('./index.js');
let urusai = new Urusai();

// TODO: Make the server close Gracefully
xdescribe('Urusai Graceful Server Closing', () => {
    test ('Gracefully close Handlers when .close() is called', () => {
        let error = null;
        urusai.close();

        try {
            urusai = new Urusai();
        } catch (err) {
            error = err;
        }

        setTimeout(() => {
            expect(error).toBe(null);
        }, 5000);
    })
});

describe ('Urusai Handlers Property', () =>  {
    test ('Exposes its Handlers property', () => {
        expect(urusai.hasOwnProperty('Handlers')).toBe(true);
    });

    test ('Handlers property is a object', () => {
        expect(Object.keys(urusai.Handlers).length).toBeGreaterThan(0);
    });
    
    test ('Populates its Handlers property with at least 1 Handler', () => {
        expect(Object.keys(urusai.Handlers).length).toBeGreaterThan(0);
    });
});
