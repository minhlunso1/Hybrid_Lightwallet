import React, {Component} from 'react';
import {Button, Row, Col} from 'reactstrap';
import {Alert} from 'reactstrap';

import ons from 'onsenui';
import {AlertDialog, Input, Select} from 'react-onsenui';

import Web3 from 'web3';
import lightwallet from 'eth-lightwallet';
import HookedWeb3Provider from 'hooked-web3-provider';

import shortid from 'shortid';
import {RPC_SERVER, MAIN_SERVER} from '../util/Settings';
import { TokenSelection } from '../util/token-lists';
import { erc20Abi } from '../util/erc20_abi';

import crypto from 'crypto';
const sourceCreateHash = crypto.createHash;
crypto.createHash = function createHash(alg) {
  if (alg === 'ripemd160') {
    alg = 'rmd160';
  }
  return sourceCreateHash(alg);
};

const erc20Contract = web3.eth.contract(erc20Abi);
const Rinkeby = 'Rinkeby';
const Main = 'Main';

class GetStarted extends Component {
  mnemonicKeys = '';

  constructor(props) {
    super(props);

    this.state = {
        sendDialogShown: false,
        sendTokenDialogShown: false,
        sendAddress: "",
        sendAmounts: "",
        walletAddress: "",
        keyStore: null,
        ethWeb3: null,
        network: RPC_SERVER,
    };

    this.showSendDialog = this.showSendDialog.bind(this);
    this.hideSendDialog = this.hideSendDialog.bind(this);
    this.sendEther = this.sendEther.bind(this);
    this.showTokenSendDialog = this.showTokenSendDialog.bind(this);
    this.hideTokenSendDialog = this.hideTokenSendDialog.bind(this);
    this.sendToken = this.sendToken.bind(this);
    this.handleSendAmountChange = this.handleSendAmountChange.bind(this);
    this.handleSendAddressChange = this.handleSendAddressChange.bind(this);
    this.editNetwork = this.editNetwork.bind(this);
    this.checkTokenBalance = this.checkTokenBalance.bind(this);
  }

  showSendDialog() { this.setState({sendDialogShown: true}); }
  hideSendDialog() { this.setState({sendDialogShown: false}); }
  showTokenSendDialog() { this.setState({sendTokenDialogShown: true}); }
  hideTokenSendDialog() { this.setState({sendTokenDialogShown: false}); }

  handleSendAmountChange(e) { this.setState({sendAmounts: e.target.value}); }
  handleSendAddressChange(e1) { this.setState({sendAddress: e1.target.value}); }

  sendEther() {
    var fromAddr = this.state.walletAddress;
    var toAddr = this.state.sendAddress;
    var valueEth = this.state.sendAmounts;
    var value = parseFloat(valueEth)*1.0e18;
    var gasPrice = 18000000000;
    var gas = 50000;

    console.log('send value:' + value);
    this.state.ethWeb3.eth.sendTransaction({from: fromAddr, to: toAddr, value: value, gasPrice: gasPrice, gas: gas}, function (err, txhash) {
      console.log('error: ' + err);
      console.log('txhash: ' + txhash);
    });
  }

  sendToken() {
    var tokenContractAddress = '';
    if (this.state.network == RPC_SERVER)
      tokenContractAddress = TokenSelection[Rinkeby][0].contractAddress;
    else if (this.state.network == MAIN_SERVER)
      tokenContractAddress = TokenSelection[Main][0].contractAddress;

    const eip20Contract = this.state.ethWeb3.eth.contract(erc20Abi);
    const tokenContract = eip20Contract.at(tokenContractAddress);

    var gasPrice = 18000000000;
    const tokenAmount = this.state.sendAmounts;
    console.log("token: " + tokenAmount);
    const sendParams = { from: this.state.walletAddress, value: '0x0', gasPrice, gas: 60000 };
    tokenContract.transfer.sendTransaction(this.state.sendAddress, tokenAmount, sendParams, (err, sendTx) => {
      if (err) {
        alert(err.message);
        return;
      }
      console.log("Transaction: " + sendTx);
    });
  }

  editNetwork(e2) {
    this.setState({network: e2.target.value});
    document.getElementById('wallet_eth').innerHTML = 'Eth Balance:';
    document.getElementById('wallet_token').innerHTML = 'Token Balance:';

    if (this.state.walletAddress.trim() != "") {
      var web3Provider = new HookedWeb3Provider({
        host: this.state.network,
        transaction_signer: this.state.keyStore
      });
      this.setState({ethWeb3: new Web3(web3Provider)});

      this.state.ethWeb3.eth.getBalance(this.state.walletAddress, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          let balance = data / 1.0e18;
          document.getElementById('wallet_eth').innerHTML = 'Eth Balance: ' + balance;
          document.getElementById('btn_refresh').style.visibility='visible';
          document.getElementById('btn_display_send').style.visibility='visible';
        }
      });
      this.checkTokenBalance();
    }
  }

  checkTokenBalance = () => {
      var tokenContractAddress = '';
      if (this.state.network == RPC_SERVER)
        tokenContractAddress = TokenSelection[Rinkeby][0].contractAddress;
      else if (this.state.network == MAIN_SERVER)
        tokenContractAddress = TokenSelection[Main][0].contractAddress;
      const tokenContract = erc20Contract.at(tokenContractAddress);
      tokenContract.balanceOf.call(this.state.walletAddress, (err, balance) => {
        if (err) return reject(err);
        if (this.state.network == RPC_SERVER)
          document.getElementById('wallet_token').innerHTML = TokenSelection[Rinkeby][0].symbol + ": " + balance;
        else if (this.state.network == MAIN_SERVER)
          document.getElementById('wallet_token').innerHTML = TokenSelection[Main][0].symbol + ": " + balance;
      });
  }

  createNewWallet = ({seed_text}) => {
    document.getElementById('btn_refresh').style.visibility = 'hidden';
    document.getElementById('btn_display_send').style.visibility='hidden';
    document.getElementById('wallet_info').style.display = 'none';

    let randomSeed;

    if (seed_text) {
      randomSeed = seed_text;
    } else {
      let extraEntropy = shortid.generate();
      randomSeed = lightwallet.keystore.generateRandomSeed(extraEntropy);
    }

    let pwd = this.password;
    let thisClass = this;

    ons.notification.prompt({ message: 'Input password', inputType: 'password' })
      .then(function(passPrompt) {
        pwd = passPrompt;
        if (!pwd) {
          return;
        }

        document.getElementById('wallet_info').style.display = 'block';

        thisClass.mnemonicKeys = randomSeed;
        let infoString = 'Wallet mnemonic words<br>"' + randomSeed + '"';
        document.getElementById('wallet_seeds').value  = randomSeed;

        lightwallet.keystore.createVault({
          password: pwd,
          seedPhrase: randomSeed,
          hdPathString: "m/0'/0'/0'"
        }, function(err, ks) {
          if (err) {
            throw err;
          }
          thisClass.state.keyStore = ks;

          ks.keyFromPassword(pwd, function(err, pwDerivedKey) {
            if (err) {
              throw err;
            }
            ks.generateNewAddress(pwDerivedKey, 1);
            var addr = ks.getAddresses();
            for (var i = 0; i < addr.length; i++) {
             document.getElementById('wallet_addr').value = addr[i];
             thisClass.state.walletAddress = addr[i];
             console.log('Address: ' + i + ': ' + addr[i]);

             var private_key = ks.exportPrivateKey(addr[i], pwDerivedKey);
             document.getElementById("wallet_private_key").value = private_key;
            }

            var web3Provider = new HookedWeb3Provider({
              host: thisClass.state.network,
              transaction_signer: ks
            });
            const ethWeb3 = new Web3(web3Provider);
            thisClass.state.ethWeb3 = ethWeb3;

            var tokenContractAddress = '';
            if (thisClass.state.network == RPC_SERVER)
              tokenContractAddress = TokenSelection[Rinkeby][0].contractAddress;
            else if (thisClass.state.network == MAIN_SERVER)
              tokenContractAddress = TokenSelection[Main][0].contractAddress;
            let addresses = ks.getAddresses();
            const tokenContract = erc20Contract.at(tokenContractAddress);

            let eth_balance = {};
            return Promise.resolve()
            .then(() => {
              return Promise.all( addresses.map((address) => {
                return new Promise((resolve, reject) => {
                  ethWeb3.eth.getBalance(address, (err, data) => {
                    if (err) {
                      console.log(err);
                    } else {
                      let balance = data / 1.0e18;
                      document.getElementById('wallet_eth').innerHTML = 'Eth Balance: ' + balance;
                      document.getElementById('btn_refresh').style.visibility='visible';
                      document.getElementById('btn_display_send').style.visibility='visible';
                      eth_balance[address] = balance;

                      tokenContract.balanceOf.call(address, (err, balance) => {
                        if (err) throw err;
                        document.getElementById('btn_token_refresh').style.visibility='visible';
                        document.getElementById('btn_display_token_send').style.visibility='visible';
                        if (thisClass.state.network == RPC_SERVER)
                          document.getElementById('wallet_token').innerHTML = TokenSelection[Rinkeby][0].symbol + ": " + balance;
                        else if (thisClass.state.network == MAIN_SERVER)
                          document.getElementById('wallet_token').innerHTML = TokenSelection[Main][0].symbol + ": " + balance;
                      });
                    }
                    resolve();
                  })
                })
              }))
            })

          });
        });
      });
  }

  unlockWallet = ({seed_text}) => {
    document.getElementById("btn_refresh").style.visibility="hidden";
    document.getElementById('btn_display_send').style.visibility='hidden';
    document.getElementById("wallet_info").style.display="none";

    let randomSeed;
    let pwd = this.password;
    let thisClass = this;

    if (seed_text){
      randomSeed = seed_text;
    } else {
      ons.notification.prompt({ message: 'Input 12 mnemonic words', inputType: 'text' })
        .then(function(textPrompt) {
          randomSeed = textPrompt;

          ons.notification.prompt({ message: 'Input password', inputType: 'password' })
            .then(function(passPrompt) {
              pwd = passPrompt;

              if (!pwd){
                return;
              }

              document.getElementById("wallet_info").style.display="block";

              thisClass.mnemonicKeys = randomSeed;
              let infoString = 'Wallet mnemonic words<br>"' + randomSeed + '"';
              document.getElementById("wallet_seeds").value = randomSeed;

              lightwallet.keystore.createVault({
                password: pwd,
                seedPhrase: randomSeed,
                hdPathString: "m/0'/0'/0'"
              }, function (err, ks) {
                  if (err)
                    throw err;
                  thisClass.state.keyStore = ks;

                  ks.keyFromPassword(pwd, function(err, pwDerivedKey) {
                    ks.generateNewAddress(pwDerivedKey, 1);
                    var addr = ks.getAddresses();
                    for (var i = 0; i < addr.length; i++) {
                      document.getElementById("wallet_addr").value = addr[i];
                      thisClass.state.walletAddress = addr[i];
                      console.log('Address: ' + i + ': ' + addr[i]);

                      var private_key = ks.exportPrivateKey(addr[i], pwDerivedKey);
                      document.getElementById("wallet_private_key").value = private_key;
                    }

                    var web3Provider = new HookedWeb3Provider({
                      host: thisClass.state.network,
                      transaction_signer: ks
                    });
                    const ethWeb3 = new Web3(web3Provider);
                    thisClass.state.ethWeb3 = ethWeb3;

                    var tokenContractAddress = '';
                    if (thisClass.state.network == RPC_SERVER)
                      tokenContractAddress = TokenSelection[Rinkeby][0].contractAddress;
                    else if (thisClass.state.network == MAIN_SERVER)
                      tokenContractAddress = TokenSelection[Main][0].contractAddress;
                    let addresses = ks.getAddresses();
                    const tokenContract = erc20Contract.at(tokenContractAddress);

                    let eth_balance = {};
                    return Promise.resolve()
                    .then(() => {
                      return Promise.all( addresses.map((address) => {
                        return new Promise((resolve, reject) => {
                          ethWeb3.eth.getBalance(address, (err, data) => {
                            if (err) {
                              console.log(err);
                            } else {
                              let balance = data / 1.0e18;
                              document.getElementById('wallet_eth').innerHTML = 'Eth Balance: ' + balance;
                              document.getElementById('btn_refresh').style.visibility='visible';
                              document.getElementById('btn_display_send').style.visibility='visible';
                              eth_balance[address] = balance;

                              tokenContract.balanceOf.call(address, (err, balance) => {
                                if (err) throw err;
                                document.getElementById('btn_token_refresh').style.visibility='visible';
                                document.getElementById('btn_display_token_send').style.visibility='visible';
                                if (thisClass.state.network == RPC_SERVER)
                                  document.getElementById('wallet_token').innerHTML = TokenSelection[Rinkeby][0].symbol + ": " + balance;
                                else if (thisClass.state.network == MAIN_SERVER)
                                  document.getElementById('wallet_token').innerHTML = TokenSelection[Main][0].symbol + ": " + balance;
                              });
                            }
                            resolve();
                          })
                        })
                      }))
                    })

                  });

              });
            });
      });
    }

  }

  render(){
    return(
      <div className="container" style={{marginTop: 30}}>

        <Select id="choose_network" value={this.state.network} onChange={this.editNetwork}>
          <option value={RPC_SERVER}>Rinkeby Network</option>
          <option value={MAIN_SERVER}>Main Network</option>
        </Select>

        <Row style={{marginTop:20}}>
          <Col xs="12" style={{textAlign: 'center'}}>
            <span style={{fontSize: 24, color: 'white'}}>Minh Ethereum Wallet</span>
          </Col>
        </Row>

        <Row style={{marginTop:40}}>
          <Col xs="12" style={{textAlign: 'center'}}>
            <Button style={{width:100 + '%', backgroundColor: '#008ecd'}}
              onClick={this.createNewWallet}>CREATE</Button>
          </Col>
        </Row>

        <Row style={{marginTop:40}}>
          <Col xs="12" style={{textAlign: 'center'}}>
            <Button style={{width:100 + '%', backgroundColor: '#008ecd'}}
              onClick={this.unlockWallet}>UNLOCK</Button>
          </Col>
        </Row>

        {/*isOpen={this.state.visible}*/}
        <Alert id="wallet_info" color="success" style={{textAlign: 'left', display: 'none', marginTop:40}}>
          <h4 className="alert-heading">Wallet Info</h4>
          <div className='text-result'>
            <p style={{marginBottom:0}}>Address</p>
            <div>
                <input id='wallet_addr' style={{backgroundColor: '#d3eddb',border: 'none',color: '#155724',width:'100%'}}></input>
            </div>
            <div>
              <Button style={{position:'absolute',right: 0, marginRight:20}}
                data-clipboard-target="#wallet_addr"
                color="info">Copy</Button>
            </div>
            <div><hr /></div>
          </div>
          <div className='text-result'>
            <p style={{marginBottom:0}}>Wallet mnemonic words</p>
            <div>
                <input id='wallet_seeds' className="mb-0" style={{backgroundColor: '#d3eddb',border: 'none',color: '#155724',width:'100%'}}></input>
            </div>
            <div>
              <Button style={{position:'absolute',right: 0, marginRight:20, marginTop:5}}
                data-clipboard-target="#wallet_seeds"
                color="info">Copy</Button>
            </div>
            <div><hr /></div>
          </div>
          <div className='text-result'>
            <p style={{marginBottom:0}}>Wallet Private Key</p>
            <div>
                <input id='wallet_private_key' className="mb-0" style={{backgroundColor: '#d3eddb',border: 'none',color: '#155724',width:'100%'}}></input>
            </div>
            <div>
              <Button style={{position:'absolute',right: 0, marginRight:20, marginTop:5}}
                data-clipboard-target="#wallet_private_key"
                color="info">Copy</Button>
            </div>
            <div><hr /></div>
          </div>
          <p id='wallet_eth' className="mb-0" style={{marginTop:40, marginRight:20, display: 'inline-block'}}></p>
          <Button id='btn_refresh' style={{display: 'inline-block', visibility: 'hidden',
          position:'absolute',right: 0, marginRight:100, marginTop:30}}
            onClick={this.unlockWallet}
            color="info">Refresh</Button>
          <Button id='btn_display_send' style={{display: 'inline-block', visibility: 'hidden',
          position:'absolute',right: 0, marginRight:20, marginTop:30}}
            onClick={this.showSendDialog}
            color="info">Send</Button>
          <br/>
          <p id='wallet_token' className="mb-0" style={{marginTop:40, marginRight:20, display: 'inline-block'}}></p>
          <Button id='btn_token_refresh' style={{display: 'inline-block', visibility: 'hidden',
          position:'absolute',right: 0, marginRight:100, marginTop:30}}
            onClick={this.checkTokenBalance}
            color="info">Refresh</Button>
          <Button id='btn_display_token_send' style={{display: 'inline-block', visibility: 'hidden',
          position:'absolute',right: 0, marginRight:20, marginTop:30}}
            onClick={this.showTokenSendDialog}
            color="info">Send</Button>
        </Alert>

        <AlertDialog
          isOpen={this.state.sendDialogShown}
          isCancelable={false}>
          <div className='alert-dialog-title'>Send Ether</div>
          <div className='alert-dialog-content'>
            <Input
              value={this.state.sendAddress}
              onChange={this.handleSendAddressChange}
              type='text'
              float
              placeholder='Address' />
            <Input
              value={this.state.sendAmounts}
              onChange={this.handleSendAmountChange}
              float
              placeholder='Amounts' />
          </div>
          <div className='alert-dialog-footer'>
            <button onClick={this.sendEther} className='alert-dialog-button'>Send</button>
            <button onClick={this.hideSendDialog} className='alert-dialog-button'>Cancel</button>
          </div>
        </AlertDialog>

        <AlertDialog
          isOpen={this.state.sendTokenDialogShown}
          isCancelable={false}>
          <div className='alert-dialog-title'>Send ERC-20 Token</div>
          <div className='alert-dialog-content'>
            <Input
              value={this.state.sendAddress}
              onChange={this.handleSendAddressChange}
              type='text'
              float
              placeholder='Address' />
            <Input
              value={this.state.sendAmounts}
              onChange={this.handleSendAmountChange}
              float
              placeholder='Amounts' />
          </div>
          <div className='alert-dialog-footer'>
            <button onClick={this.sendToken} className='alert-dialog-button'>Send</button>
            <button onClick={this.hideTokenSendDialog} className='alert-dialog-button'>Cancel</button>
          </div>
        </AlertDialog>

      </div>
    )
  }
}

export default GetStarted;
