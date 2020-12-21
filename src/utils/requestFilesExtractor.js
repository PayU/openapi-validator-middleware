module.exports = (req) => {
    if (req.file || req.files) {
        const files = req.files ? req.files : [];
        if (req.file) {
            files.push(req.file);
        }
        return files;
    }
};
