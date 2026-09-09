exports.get500 = (req, res) => {
    return res.status(500).render('500', {
        pageTitle: 'خطای سرور',
        isAuthenticated: req.session.isLoggedIn,
    })
}