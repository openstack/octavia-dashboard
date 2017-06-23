/*
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function() {
  'use strict';

  describe('LBaaS v2 Workflow Modal Service', function() {
    var modalService, modal, response;

    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.conf'));
    beforeEach(module('horizon.framework.widgets.toast'));
    beforeEach(module('horizon.dashboard.project.lbaasv2'));

    beforeEach(module(function($provide) {
      response = {
        data: {
          id: '1'
        }
      };
      modal = {
        open: function() {
          return {
            result: {
              then: function(func) {
                func(response);
              }
            }
          };
        }
      };

      $provide.value('$uibModal', modal);
    }));

    beforeEach(inject(function ($injector) {
      modalService = $injector.get('horizon.dashboard.project.lbaasv2.workflow.modal');
    }));

    it('should define an init function', function() {
      expect(modalService.init).toBeDefined();
    });

    describe('modalService "perform" function tests', function() {
      var toastService;

      beforeEach(inject(function ($injector) {
        toastService = $injector.get('horizon.framework.widgets.toast.service');
      }));

      it('calls modal.open', function() {
        spyOn(modal, 'open').and.callThrough();
        modalService.init({}).perform();

        expect(modal.open).toHaveBeenCalled();
      });

      it('calls modal.open with expected values', function() {
        spyOn(modal, 'open').and.callThrough();
        modalService.init({}).perform();

        var args = modal.open.calls.argsFor(0)[0];
        expect(args.backdrop).toBe('static');
        expect(args.controller).toBeDefined();
        expect(args.resolve).toBeDefined();
        expect(args.resolve.launchContext).toBeDefined();
      });

      it('launchContext function returns argument passed to open function', function() {
        spyOn(modal, 'open').and.callThrough();
        modalService.init({}).perform('foo');

        var args = modal.open.calls.argsFor(0)[0];
        expect(args.resolve.launchContext()).toBe('foo');
      });

      it('shows message upon success', function() {
        spyOn(toastService, 'add').and.callThrough();
        modalService.init({ message: 'foo' }).perform();

        expect(toastService.add).toHaveBeenCalledWith('success', 'foo');
      });

      it('handles response upon success', function() {
        spyOn(toastService, 'add').and.callThrough();
        var args = { handle: angular.noop };
        spyOn(args, 'handle');
        modalService.init(args).perform();

        expect(args.handle).toHaveBeenCalledWith(response);
      });

    });

  });
})();
