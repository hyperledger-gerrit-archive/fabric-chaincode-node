module.exports.appendOrUpdate = function appendOrUpdate(arr, primaryField, id, data) {
    const objExists = arr.some((obj) => {
        if (obj[primaryField] === id) {
            Object.assign(obj, data);
            return true;
        }
    });

    if (!objExists) {
        const obj = data;
        data[primaryField] = id;
        arr.push(obj);
    }
};