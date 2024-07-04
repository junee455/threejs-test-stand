import * as THREE from "three";

const MAX_VALUES_ACCUMULATED = 100;

export class NotchFilter {
  private values: number[] = [];

  private average = 0;

  private min = 0;
  private max = 0;

  private cutoffPercent = 0.4;

  private error = 0.1;
  private errorMargin = 0;

  getAverageRange() {
    const len = this.values.length;
    const averRange = this.values.slice(
      ((len * this.cutoffPercent) | 0) + 1,
      (len * (1 - this.cutoffPercent)) | 0);

    if(averRange.length === 0) {
      return [this.average];
    }

    return averRange;
  }

  getAverage() {
    return this.average;
  }
  
  accumulate(val: number) {
    this.values.push(val);
    if(this.values.length > MAX_VALUES_ACCUMULATED) {
      this.values = this.values.slice(this.values.length - MAX_VALUES_ACCUMULATED);
    }
    this.values.sort((a, b) => a - b);

    const averageRange = this.getAverageRange();

    this.average = 0;

    for (let i = 0; i < averageRange.length; i++) {
      this.average += averageRange[i];
    }

    this.average = this.average / averageRange.length;

    this.max = this.values[this.values.length - 1];
    this.min = this.values[0];

    this.errorMargin = ((this.max - this.min) * this.error) / 2;
  }

  filter(val: number) {
    const delta = Math.abs(val - this.average);
    return delta <= this.errorMargin;
  }
}


export class Vector3NotchFilter {
  filterX = new NotchFilter()
  filterY = new NotchFilter()
  filterZ = new NotchFilter()

  accumulate(vect: THREE.Vector3) {
    const filters = [this.filterX, this.filterY, this.filterZ];

    vect.toArray().forEach((component, i) => {
      filters[i].accumulate(component);
    })
  }

  average() {
    const averages = [this.filterX, this.filterY, this.filterZ].map(f => f.getAverage());
    return new THREE.Vector3(...averages);
  }
  
  filter(vect: THREE.Vector3): THREE.Vector3 {
    const filters = [this.filterX, this.filterY, this.filterZ];

    const result = vect.toArray().map((component, i) => {
      return filters[i].filter(component) ? component : filters[i].getAverage();
    }) as [number, number, number];

    return new THREE.Vector3(...result);
  }
}

export class EulerNotchFilter {
  filterX = new NotchFilter()
  filterY = new NotchFilter()
  filterZ = new NotchFilter()

  accumulateEuler(vect: THREE.Euler) {
    const filters = [this.filterX, this.filterY, this.filterZ];

    vect.toArray().slice(0, 3).forEach((component, i) => {
      filters[i].accumulate(component as number);
    })
  }

  accumulateQuat(quat: THREE.Quaternion) {
    const euler = new THREE.Euler();
    euler.setFromQuaternion(quat, "XYZ");

    this.accumulateEuler(euler);
  }

  averageEuler() {
    const averages = [this.filterX, this.filterY, this.filterZ].map(f => f.getAverage());

    return new THREE.Euler(...averages);
  }

  averageQuat() {
    const quat = new THREE.Quaternion();
    const euler = this.averageEuler();
    quat.setFromEuler(euler);
    return quat;
  }

  filterEuler(vect: THREE.Euler): THREE.Euler {
    const filters = [this.filterX, this.filterY, this.filterZ];

    const order = vect.order;

    const result = vect.clone().reorder("XYZ").toArray().slice(0, 3).map((component, i) => {
      return filters[i].filter(component as number) ? component : filters[i].getAverage();
    }) as [number, number, number];

    return new THREE.Euler(...result, order);
  }

  filterQuat(quat: THREE.Quaternion): THREE.Quaternion {
    const euler = new THREE.Euler();
    euler.setFromQuaternion(quat, "XYZ");

    const eulerFilter = this.filterEuler(euler);

    const result = new THREE.Quaternion();
    result.setFromEuler(eulerFilter);

    return result;
  }
}