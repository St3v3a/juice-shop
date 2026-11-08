describe('/#/privacy-security/change-password', () => {
  describe('as Morty', () => {
    beforeEach(() => {
      cy.login({
        email: 'morty',
        password: 'focusOnScienceMorty!focusOnScience'
      })
      cy.visit('/#/privacy-security/change-password')
    })

    it('should be able to change password', () => {
      cy.get('#currentPassword').focus().type('focusOnScienceMorty!focusOnScience')
      cy.get('#newPassword').focus().type('GonorrheaCantSeeUs!')
      cy.get('#newPasswordRepeat').focus().type('GonorrheaCantSeeUs!')
      cy.get('#changeButton').click()

      cy.get('.confirmation').should('not.be.hidden')
    })
  })

  describe('challenge "changePasswordBenderChallenge"', () => {
    it('should reject a password change without the current password', () => {
      cy.login({
        email: 'bender',
        password: 'OhG0dPlease1nsertLiquor!'
      })
      cy.visit('/#/privacy-security/change-password')
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token')
        expect(token).not.to.equal(null)
        cy.request({
          method: 'GET',
          url: '/rest/user/change-password?new=slurmCl4ssic&repeat=slurmCl4ssic',
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false
        }).its('status').should('eq', 401)
      })
    })
  })
})
