<template>
  <div class="container">
    <div class="form-group">
      <b-button v-b-toggle.sidebar-1 variant="outline-success">All Requests</b-button>
      <b-button @click="new_folder" variant="outline-success"><i class="fa fa-folder"/> New folder</b-button>
    </div>

    <div class="form-group">
      <b-input-group>
        <template #prepend>
          <b-form-select v-model="Request.Method" :options="Master.Method"></b-form-select>
        </template>
        <b-form-input v-model="Request.Url"></b-form-input>
        <template #append>
          <b-button v-show="Request._rev!==''" :disabled="Processing" @click="update_request" variant="outline-warning">
            <span v-if="Processing">Wait</span>
            <span v-else>Update</span>
          </b-button>
          <b-button :disabled="Processing" @click="send_request" variant="outline-success">
            <span v-if="Processing">Wait</span>
            <span v-else>Send</span>
          </b-button>
        </template>
      </b-input-group>
    </div>
    <div>
      <ul class="nav nav-tabs" id="myTab" role="tablist">
        <li class="nav-item">
          <a class="nav-link active" id="home-tab" data-toggle="tab" href="#body" role="tab" aria-controls="home"
             aria-selected="true">Body</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" id="profile-tab" data-toggle="tab" href="#header" role="tab"
             aria-selected="false">Header</a>
        </li>
      </ul>
      <div class="tab-content" id="myTabContent">
        <div class="tab-pane fade show active" id="body" role="tabpanel">
          <p>Your body here:</p>
          <b-input-group class="mb-1" v-for="(item, index) of Request.Body" :key="index">
            <b-form-input @click="add_body(index)" placeholder="key" v-model="item.key"></b-form-input>
            <b-form-input placeholder="value" v-model="item.value"></b-form-input>
            <template #append>
              <b-button @click="remove_body(index)" variant="outline-danger"><i class="fa fa-times"/></b-button>
            </template>
          </b-input-group>
        </div>
        <div class="tab-pane fade" id="header" role="tabpanel">
          <p>Your headers here:</p>
          <b-input-group v-for="(item, index) of Request.Header" :key="index">
            <b-form-input @click="add_header(index)" placeholder="key"
                          v-model="item.key"></b-form-input>
            <b-form-input placeholder="value" v-model="item.value"></b-form-input>
            <template #append>
              <b-button @click="remove_header(index)" variant="outline-danger"><i class="fa fa-times"/></b-button>
            </template>
          </b-input-group>
        </div>
      </div>
    </div>
    <hr/>
    <div class="form-group">
      <b-card
          header="Response"
          header-tag="header"
      >
        <b-card-text>
          {{ Response }}
        </b-card-text>
      </b-card>
    </div>
    <div id="modal-request" class="modal" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">New Request</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <label>Request Name</label>
            <input type="text" class="form-control mb-1" v-model="Master.Request.Name"/>
            <b-input-group>
              <template #prepend>
                <b-form-select v-model="Master.Request.Method" :options="Master.Method"></b-form-select>
              </template>
              <b-form-input v-model="Master.Request.Url" placeholder="Url"></b-form-input>
            </b-input-group>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
            <button @click="save_request" type="button" class="btn btn-primary">Save</button>
          </div>
        </div>
      </div>
    </div>
    <b-sidebar id="sidebar-1" title="PakPos Data" shadow>
      <ul class="fa-ul">
        <li v-for="(item, index) of Master.Data.folders"><span class="fa-li"></span>
          <div class="d-flex justify-content-between px-2">
            <div>
              <i class="fa fa-folder"/>
              <span class="folder"> {{ item.name }} </span>
            </div>
           <div>
             <i @click="open_modal_request(item)" class="fa fa-plus-square"/>
             <i @click="remove_folder(item)" class="fa fa-times text-danger"/>
           </div>
          </div>

          <ol>
            <li class="d-flex justify-content-between mr-1 mb-1" @click="open_request(i, ind)"
                v-for="(i, ind) of item.requests" :key="ind">
              <a href="#">{{ i.Name }}</a>
              <i @click="delete_request(item.id, ind)" class="fa fa-times text-danger"/>
            </li>
          </ol>
        </li>
      </ul>
    </b-sidebar>

  </div>

</template>
<script>
import Swal from 'sweetalert2'
import $ from 'jquery'

const {ipcRenderer} = require('electron')
var PouchDB = require('pouchdb');
import find from 'pouchdb-find';
import rel from 'relational-pouch';

PouchDB.plugin(find)
    .plugin(rel);
var db = new PouchDB('pakpos');
db.setSchema([
  {
    singular: 'folder',
    plural: 'folders',
    relations: {
      requests: {hasMany: 'request'}
    }
  },
  {
    singular: 'request',
    plural: 'requests',
    relations: {
      post: {belongsTo: 'folder'}
    }
  }
]);
export default {
  data() {
    return {
      Master: {
        Method: [
          {value: 'GET', text: 'GET'},
          {value: 'POST', text: 'POST'},
        ],
        Data: [],
        Request: {
          Name: "My Request",
          Sync: false,
          Method: 'GET',
          Url: '',
          Body: [
            {key: 'username', value: '082225005825'},
            {key: 'password', value: '12345678'}
          ],
          Header: [
            {key: 'accept', value: 'application/json'},
            {key: '', value: ''},
          ],
        }
      },
      Request: {
        Name: "My Request",
        Sync: false,
        Method: 'GET',
        Url: 'http://bengkelbaik.test/api/v1/test',
        Body: [
          {key: 'username', value: '082225005825'},
          {key: 'password', value: '12345678'}
        ],
        Header: [
          {key: 'accept', value: 'application/json'},
          {key: '', value: ''},
        ],
        Index: 0
      },
      Response: '',
      Processing: false,
    }
  },
  methods: {
    add_body(index) {
      let body_count = this.Request.Body.length
      if (body_count === index + 1) {
        this.Request.Body.push({key: '', value: ''})
      }

    },
    add_header(index) {
      let header_count = this.Request.Header.length
      if (header_count === index + 1) {
        this.Request.Header.push({key: '', value: ''})
      }

    },
    remove_body(index) {
      if (this.Request.Body.length > 1) {
        this.Request.Body.splice(index, 1);
      }
    },
    remove_header(index) {
      if (this.Request.Header.length > 1) {
        this.Request.Header.splice(index, 1);
      }
    },
    send_request() {
    if(this.Request.Url===''){
      this.Response = "Error: URL is required"
    }else{
      this.Processing = true
      ipcRenderer.send('send-request', this.Request)
      ipcRenderer.on('response-request', (event, arg) => {
        this.Response = arg
        this.Processing = false
      })
    }

    },
    save_request() {
      db.rel.find('folder', this.Master.Request.folder).then(res => {
        res.folders[0].requests.push(this.Master.Request)
        return db.rel.save('folder', res.folders[0]).then(res => {
          this.get_requests()
          $("#modal-request").modal('hide')
          this.Master.Request = {
            Name: "My Request",
            Sync: false,
            Method: 'GET',
            Url: '',
            Body: [
              {key: '', value: ''},
            ],
            Header: [
              {key: 'accept', value: 'application/json'},
              {key: '', value: ''},
            ],
          }
        })
      });

    },
    get_requests() {
      db.allDocs({include_docs: true, descending: true}).then(doc => {

      })
      db.rel.find('folder').then(doc => {
        this.Master.Data = doc
      })
    },
    open_request(item, index) {
      this.Request = item
      this.Request.Index = index
    },
    delete_request(id, index) {
      db.rel.find('folder', id).then(res => {
        res.folders[0].requests.splice(index, 1)
        return db.rel.save('folder', res.folders[0]).then(res => {
          this.get_requests()
          $("#modal-request").modal('hide')
        })
      });
    },
    update_request() {
      Swal.fire({
        input: 'text',
        inputValue: this.Request.Name,
        inputLabel: 'Request Name',
        showCancelButton: true,
        confirmButtonText: "Save",
        ccancelButtonText: "Cancel",
      }).then(res => {
        if (res.isConfirmed) {
          this.Request.Name = res.value
          db.rel.find('folder', this.Request.folder).then(res => {
            var index = this.Request.Index
            this.Request.Index = null
            res.folders[0].requests[index] = this.Request
            return db.rel.save('folder', res.folders[0]).then(res => {
              this.get_requests()
              $("#modal-request").modal('hide')
            })
          });
        }
      })
    },
    new_folder() {
      Swal.fire({
        input: 'text',
        inputValue: "New Folder",
        inputLabel: 'Folder Name',
        showCancelButton: true,
        confirmButtonText: "Save",
        ccancelButtonText: "Cancel",
      }).then(res => {
        if (res.isConfirmed) {
          var folder = {
            name: res.value,
            reqs: []
          };
          db.rel.save('folder', folder).then(res => {
            this.get_requests()
          })
        }
      })
    },
    open_modal_request(item) {
      this.Master.Request.folder = item.id
      $("#modal-request").modal('show')
    },
    remove_folder(item){
      db.rel.del('folder', {id:item.id, rev:item.rev}).then(res=>{
        this.get_requests()
      })
    }
  },
  mounted() {

    this.get_requests()
  }
}
</script>

<style scoped>
.folder {
  cursor: default
}
</style>
