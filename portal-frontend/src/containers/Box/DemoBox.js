import React from 'react';
import IntlMessages from '@iso/components/utility/intlMessages';

const ReactComponenta1 = () => <h2><IntlMessages id="box.demo.hello" /></h2>;
const ReactComponenta2 = () => <input />;
const ReactComponenta3 = () => <button><IntlMessages id="box.demo.addMe" /></button>;

const allBox = [
  {
    uid: 'a1',
    title: 'box.demo.box1.title',
    content: 'box.demo.lorem',
    reactComponent: ReactComponenta1,
  },
  {
    uid: 'a2',
    title: 'box.demo.box2.title',
    content: 'box.demo.lorem',
    reactComponent: ReactComponenta2,
  },
  {
    uid: 'a3',
    title: 'box.demo.box3.title',
    content: 'box.demo.lorem',
    reactComponent: ReactComponenta3,
  },
  {
    uid: 'a4',
    title: 'box.demo.box4.title',
    content: 'box.demo.lorem',
    reactComponent: ReactComponenta3,
  },
];

export default allBox;
