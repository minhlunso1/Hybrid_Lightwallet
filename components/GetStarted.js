import React, {Component} from 'react';
import {Button, Row, Col} from 'reactstrap';
import {Alert} from 'reactstrap';

import ons from 'onsenui';
import CopyText from 'react-copy-text';

import Web3 from 'web3';
import lightwallet from 'eth-lightwallet';
import HookedWeb3Provider from 'hooked-web3-provider';

import shortid from 'shortid';
import {RPC_SERVER} from '../util/Settings';

import crypto from 'crypto';
const sourceCreateHash = crypto.createHash;
crypto.createHash = function createHash(alg) {
  if (alg === 'ripemd160') {
    alg = 'rmd160';
  }
  return sourceCreateHash(alg);
};

class GetStarted extends Component {

  state = {textToCopy: ''};
  walletAddress = '';
  mnemonicKeys = '';

  onAddressCopyClick = () => this.setState({ textToCopy: this.walletAddress })
  onSeedCopyClick = () => this.setState({ textToCopy: this.mnemonicKeys })
  onCopied = (text) => console.log(`${text} was copied to the clipboard`)

  constructor(props) {
    super(props);
  }

  createNewWallet = ({seed_text}) => {
    document.getElementById('btn_refresh').style.visibility = 'hidden';
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
        document.getElementById('wallet_seeds').innerHTML = infoString;

        lightwallet.keystore.createVault({
          password: pwd,
          seedPhrase: randomSeed,
          hdPathString: "m/0'/0'/0'"
        }, function(err, ks) {
          if (err) {
            throw err;
          }

          ks.keyFromPassword(pwd, function(err, pwDerivedKey) {
            if (err) {
              throw err;
            }
            ks.generateNewAddress(pwDerivedKey, 1);
            var addr = ks.getAddresses();
            for (var i = 0; i < addr.length; i++) {
             document.getElementById('wallet_addr').innerHTML = 'Address<br>' + addr[i];
             thisClass.walletAddress = addr[i];
             console.log('Address: ' + i + ': ' + addr[i]);
            }

            var web3Provider = new HookedWeb3Provider({
              host: RPC_SERVER,
              transaction_signer: ks
            });
            const ethWeb3 = new Web3(web3Provider);

            let addresses = ks.getAddresses();
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
                      eth_balance[address] = balance;
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

  setWeb3Provider = ({ wallet }) => {
    if (wallet != null) {
      console.log('not null');
    }
    var web3Provider = new HookedWeb3Provider({
      host: RPC_SERVER,
      transaction_signer: wallet
    });

    const ethWeb3 = new Web3(web3Provider);

    return ethWeb3;
  }

  getBalances = ({ _web3, _wallet }) => {
    let web3 = _web3;
    let wallet = _wallet;

    let addresses = wallet.getAddresses();
    let eth_balance = {};

    return Promise.resolve()
    .then(() => {
      return Promise.all( addresses.map((address) => {
        return new Promise((resolve, reject) => {
          web3.eth.getBalance(address, (err, data) => {
            if (err) {
              console.log(err);
            } else {
              let balance = data / 1.0e18;
              document.getElementById('wallet_eth').innerHTML = 'Eth Balance: ' + balance;
              document.getElementById('btn_refresh').style.visibility='visible';
              eth_balance[address] = balance;
            }
            resolve();
          })
        })
      }))
    })
  }

  unlockWallet = ({seed_text}) => {
    document.getElementById("btn_refresh").style.visibility="hidden";
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
              document.getElementById("wallet_seeds").innerHTML = infoString;

              lightwallet.keystore.createVault({
                password: pwd,
                seedPhrase: randomSeed,
                hdPathString: "m/0'/0'/0'"
              }, function (err, ks) {
                  if (err)
                    throw err;

                  ks.keyFromPassword(pwd, function(err, pwDerivedKey) {
                    ks.generateNewAddress(pwDerivedKey, 1);
                    var addr = ks.getAddresses();
                    for (var i = 0; i < addr.length; i++) {
                      document.getElementById("wallet_addr").innerHTML = "Address<br>" + addr[i];
                      thisClass.walletAddress = addr[i];
                      console.log('Address: ' + i + ': ' + addr[i]);
                    }

                    var web3Provider = new HookedWeb3Provider({
                      host: RPC_SERVER,
                      transaction_signer: ks
                    });
                    const ethWeb3 = new Web3(web3Provider);

                    let addresses = ks.getAddresses();
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
                              eth_balance[address] = balance;
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
            <div><p id='wallet_addr'></p></div>
            <div>
              <Button style={{position:'absolute',right: 0, marginRight:20}}
                onClick={this.onAddressCopyClick}
                color="info">Copy</Button>
              <CopyText text={this.state.textToCopy} onCopied={this.onCopied} />
            </div>
            <div><hr /></div>
          </div>
          <div className='text-result'>
            <div><p id='wallet_seeds' className="mb-0"></p></div>
            <div>
              <Button style={{position:'absolute',right: 0, marginRight:20, marginTop:5}}
                onClick={this.onSeedCopyClick}
                color="info">Copy</Button>
              <CopyText text={this.state.textToCopy} onCopied={this.onCopied} />
            </div>
            <div><hr /></div>
          </div>
          <p id='wallet_eth' className="mb-0" style={{marginTop:40, marginRight:20, display: 'inline-block'}}></p>
          <Button id='btn_refresh' style={{display: 'inline-block', visibility: 'hidden',
          position:'absolute',right: 0, marginRight:20, marginTop:30}}
            onClick={this.unlockWallet}
            color="info">Refresh</Button>
        </Alert>

      </div>
    )
  }
}

export default GetStarted;
