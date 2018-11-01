title=Contributing
date=2018-11-01
type=guide
status=published
~~~~~~

<!--Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.-->

# Contributing to Apache Doris (incubating)

Thanks for your interest in contributing.
As you see from [GitHub] (https://github.com/apache/incubator-doris), Apache Doris (incubating)’s codebase consists of two parts: frontend (FE) which written in JAVA and backend (BE) which writte in C++.

## 1. How to contribute?

Most of the contributions that we receive are code contributions, but you can
also contribute to the documentation or simply report solid bugs
for us to fix.

When you contribute code, you affirm that the contribution is your original work and that you license the work to the project under the project’s open source license. Whether or not you state this explicitly, by submitting any copyrighted material via pull request, email, or other means you agree to license the material under the project’s open source license and warrant that you have the legal authority to do so.

## 2. GitHub Workflow

### 2.1 How to fork and pull request

1) Fork the apache/incubator-doris repository into your GitHub account

    <https://github.com/apache/incubator-doris/fork>

2) Clone your fork of the GitHub repository


```
git clone git@github.com:<username>/doris.git
```
Replace `<username>` with your GitHub username.


3) Add a remote to keep up with upstream changes

```
git remote add upstream https://github.com/apache/incubator-doris.git
```

If you already have a copy, fetch upstream changes

```
git fetch upstream master
```

4) Create a feature branch to work in

```
git checkout -b feature-xxx remotes/upstream/master
```

5) Before submitting a pull request periodically rebase your changes
    (but don't do it when a pull request is already submitted)

```
git pull --rebase upstream master
```

6) Before submitting a pull request, combine ("squash") related commits into a single one

```
git rebase upstream/master
```

7) Submit a pull-request

```
git push origin feature-xxx
```

Go to your Doris fork main page

```
https://github.com/<username>/doris
```

If you recently pushed your changes GitHub will automatically pop up a `Compare & pull request` button for any branches you recently pushed to. If you click that button it will automatically offer you to submit your pull-request to the apache/incubator-doris repository.

Give your pull-request a meaningful title.

In the description, explain your changes and the problem they are solving.

8) Addressing code review comments

Address code review comments by committing changes and pushing them to your feature branch.

```
git push origin feature-xxx
```

### 2.2 If your pull request shows conflicts with master
If your pull request shows conflicts with master, merge master into your feature branch:

```
git merge upstream/master
```

and resolve the conflicts. After resolving conflicts, push your branch again:

```
git push origin feature-xxx
```

Avoid rebasing and force pushes after submitting a pull request, since these make it difficult for reviewers to see what you've changed in response to their reviews.

The Doris committer that merges your change will rebase and squash it into a single commit before committing it to master.

## 3. How to report a bug

Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/apache/incubator-doris/issues).

If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/apache/incubator-doris/issues/new).

Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.


## 4. How to add a new feature or change an existing one

Before making any significant changes, please [open an issue](https://github.com/apache/incubator-doris/issues). Discussing your proposed changes ahead of time will make the contribution process smooth for everyone.

Once we've discussed your changes and you've got your code ready, make sure that tests are passing and open your pull request. Your PR is most likely to be accepted if it:

* Update the README.md with details of changes to the interface.
* Includes tests for new functionality.
* References the original issue in description, e.g. "Resolves #123".
* Has a good commit message: (refer to <https://chris.beams.io/posts/git-commit/>)
	* Separate subject from body with a blank line.
	* Limit the subject line to 50 characters.
	* Capitalize the subject line.
	* Do not end the subject line with a period.
	* Use the imperative mood in the subject line.
	* Wrap the body at 72 characters.
	* Use the body to explain what and why vs. how.

## 5. Contact US

You can contact us by one of following way:

* Development maillist: <dev@doris.apache.org>
* Website: <http://doris.apache.org>

Subscribe to the dev list <dev@doris.apache.org>. You do that by sending mail to <dev-subscribe@doris.apache.org>.
