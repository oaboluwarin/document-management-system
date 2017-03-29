/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import helper from '../helper';
import model from '../../models';

const Role = model.Role;

const firstRole = helper.createAdminRole();

describe('The Role Model Test Suite', () => {
  before(() => model.sequelize.sync({ force: true }));
  describe('The Process of creation of a Role', () => {
    let role;
    before((done) => {
      Role.create(firstRole)
        .then((createdRole) => {
          role = createdRole;
          done();
        });
    });

    after(() => model.sequelize.sync({ force: true }));

    it('should allow the creation of a role to be possible', () => {
      expect(role).to.exist;
      expect(typeof role).to.equal('object');
    });

    it('should allow a creator to define the title of role created', () => {
      expect(firstRole).to.include.keys('title');
      expect(role.title).to.equal(firstRole.title);
    });
  });

  describe('Role Model Validations Test Suite', () => {
    after(() => model.sequelize.sync({ force: true }));

    describe('Validation for the Title field', () => {
      it('should ensure that a title is given before a role can be created',
        (done) => {
          Role.create()
            .catch((error) => {
              expect(/notNull Violation/.test(error.message)).to.be.true;
              done();
            });
        });

      it(`should ensure that it is impossible
      to create two roles with the same title`,
        (done) => {
          Role.create(firstRole)
            .then(() => {
              // attempt to create a second role with same title
              Role.create(firstRole)
                .catch((error) => {
                  expect(/UniqueConstraintError/.test(error.name)).to.be.true;
                  done();
                });
            });
        });
    });
  });
});