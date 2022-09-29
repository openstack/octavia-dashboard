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

  angular
    .module('horizon.dashboard.project.lbaasv2')
    .factory('horizon.dashboard.project.lbaasv2.workflow.modal', modalService);

  modalService.$inject = [
    '$rootScope',
    'horizon.dashboard.project.lbaasv2.events',
    '$uibModal',
    'horizon.framework.widgets.toast.service'
  ];

  /**
   * @ngdoc service
   * @ngname horizon.dashboard.project.lbaasv2.workflow.modal
   *
   * @description
   * Provides the service for opening the LBaaS create / edit modal.
   *
   * @param $rootScope The angular root scope object.
   * @param events The LBaaS v2 events object.
   * @param $uibModal The angular bootstrap $uibModal service.
   * @param toastService The horizon toast service.
   * @returns The modal service for the LBaaS workflow.
   */

  function modalService($rootScope, events, $uibModal, toastService) {

    var service = {
      init: init
    };

    return service;

    //////////////

    /**
     * @ngdoc method
     * @name init
     *
     * @description
     * Initialize a new scope for an LBaaS workflow modal.
     *
     * @param args An object containing the following properties:
     *   controller*: Controller to use for the wizard instance.
     *   message*: String to display using the toast service when wizard completes.
     *   allowed*: Function used to determine if the workflow action is allowed.
     *   handle: Function to call after the modal closes, receives the result of wizard submit.
     * @returns An object with a single function 'open', used to open the modal.
     */

    function init(args) {
      return {
        handle: args.handle, // exposed just for testing
        allowed: args.allowed,
        perform: open
      };

      /**
       * @ngdoc method
       * @name open
       *
       * @description
       * Open the modal.
       *
       * @param item The row item from the table action.
       * @returns undefined
       */

      function open(item) {
        var spec = {
          size: 'lg',
          backdrop: 'static',
          controller: 'ModalContainerController',
          template: '<wizard class="wizard lbaas-wizard" ng-controller="' +
            args.controller + '"></wizard>',
          windowClass: 'modal-dialog-wizard',
          resolve: {
            launchContext: function() {
              return item;
            }
          }
        };
        return $uibModal.open(spec).result.then(onModalClose);
      }

      function onModalClose(response) {
        toastService.add('success', args.message);
        if (args.handle) {
          $rootScope.$broadcast(events.ACTION_DONE);
          return args.handle(response);
        }
        return null;
      }
    }

  }
})();
